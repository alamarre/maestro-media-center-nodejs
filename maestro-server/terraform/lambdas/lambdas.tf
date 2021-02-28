terraform {
  backend "s3" {
    bucket  = "terraform.omny.ca"
    profile = "maestro-terraform"
    key     = "lambdas"
    region  = "us-east-1"
  }
}

provider "aws" {
  region  = "us-east-1"
  profile = "maestro-terraform"
}

data "aws_region" "current" {
}

data "aws_caller_identity" "current" {
}

data "archive_file" "import_lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../out/"
  output_path = "${path.module}/import_lambda.zip"
}

data "aws_iam_policy_document" "sns-publish-sqs-policy" {
  statement {
    sid    = "any-sns-topic"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions = [
      "SQS:SendMessage",
    ]

    resources = [
      "arn:aws:sqs:*:${data.aws_caller_identity.current.account_id}:*",
    ]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceAccount"

      values = [
        data.aws_caller_identity.current.account_id,
      ]
    }
  }
}

resource "aws_sns_topic" "insert_video_sources" {
  name = "insert-video_sources"
}

resource "aws_sns_topic" "remove_video_sources" {
  name = "remove-video_sources"
}

resource "aws_s3_bucket" "deployment_bucket" {
  bucket = var.deployment_bucket
  acl    = "private"
}

resource "aws_s3_bucket_object" "object" {
  bucket = aws_s3_bucket.deployment_bucket.id
  key    = "prefix${data.archive_file.import_lambda_zip.output_base64sha256}"
  source = data.archive_file.import_lambda_zip.output_path
  etag   = data.archive_file.import_lambda_zip.output_base64sha256
}

resource "aws_s3_bucket_object" "resizer" {
  bucket = aws_s3_bucket.deployment_bucket.id
  key    = "prefix${data.archive_file.import_lambda_zip.output_base64sha256}"
  source = data.archive_file.import_lambda_zip.output_path
  etag   = data.archive_file.import_lambda_zip.output_base64sha256
}

resource "aws_lambda_function" "maintain_cache" {
  function_name    = "maestro_maintain_cache"
  role             = "arn:aws:iam::990455710365:role/lambda-import-s3"
  handler          = "lambdas/MaintainCache.handler"
  s3_bucket        = aws_s3_bucket.deployment_bucket.id
  s3_key           = aws_s3_bucket_object.object.id
  source_code_hash = data.archive_file.import_lambda_zip.output_base64sha256
  runtime          = "nodejs12.x"
  timeout          = "15"
  memory_size      = "512"

  environment {
    variables = {
      DB_BUCKET = var.db_bucket
    }
  }
}

resource "aws_lambda_permission" "video_sources_maintain_cache_permission" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.maintain_cache.function_name
  principal     = "sns.amazonaws.com"
}

resource "aws_sns_topic_subscription" "video_sources_maintain_cache_add" {
  topic_arn = aws_sns_topic.insert_video_sources.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.maintain_cache.arn
}

resource "aws_sns_topic_subscription" "video_sources_maintain_cache_delete" {
  topic_arn = aws_sns_topic.remove_video_sources.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.maintain_cache.arn
}

resource "aws_lambda_function" "route_messages" {
  function_name    = "maestro_route_messages"
  role             = "arn:aws:iam::990455710365:role/lambda-import-s3"
  handler          = "lambdas/RouteMessages.handler"
  s3_bucket        = aws_s3_bucket.deployment_bucket.id
  s3_key           = aws_s3_bucket_object.object.id
  source_code_hash = data.archive_file.import_lambda_zip.output_base64sha256
  runtime          = "nodejs12.x"
  timeout          = "15"
  memory_size      = "512"

  environment {
    variables = {
      MAIN_ACCOUNT = var.main_maestro_account
      TOPIC_PREFIX = "arn:aws:sns:us-east-1:${data.aws_caller_identity.current.account_id}:"
    }
  }
}

resource "aws_lambda_function" "vide_added_time" {
  function_name    = "maestro_video_added_time"
  role             = "arn:aws:iam::990455710365:role/lambda-import-s3"
  handler          = "lambdas/NewVideoTimeAdded.handler"
  s3_bucket        = aws_s3_bucket.deployment_bucket.id
  s3_key           = aws_s3_bucket_object.object.id
  source_code_hash = data.archive_file.import_lambda_zip.output_base64sha256
  runtime          = "nodejs12.x"
  timeout          = "15"
  memory_size      = "512"

  environment {
    variables = {
      DB_BUCKET = var.db_bucket
    }
  }
}

resource "aws_lambda_permission" "video_sources_video_added_time_permission" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.vide_added_time.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.insert_video_sources.arn
}

resource "aws_sns_topic_subscription" "video_sources_video_added_time" {
  topic_arn = aws_sns_topic.insert_video_sources.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.vide_added_time.arn
}

resource "aws_lambda_function" "fetch_metadata" {
  function_name    = "maestro_fetch_metadata_from_dynamo_stream"
  role             = "arn:aws:iam::990455710365:role/lambda-import-s3"
  handler          = "lambdas/FetchMetadata.handler"
  s3_bucket        = aws_s3_bucket.deployment_bucket.id
  s3_key           = aws_s3_bucket_object.object.id
  source_code_hash = data.archive_file.import_lambda_zip.output_base64sha256
  runtime          = "nodejs12.x"
  timeout          = "15"
  memory_size      = "512"

  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }

  environment {
    variables = {
      DB_BUCKET        = var.db_bucket
      IMAGE_BUCKET     = var.metadata_source_bucket
      TMDB_KEY         = var.tmdb_key
      MAIN_ACCOUNT     = var.main_maestro_account
      RESIZE_SNS_TOPIC = aws_sns_topic.image_resizer_topic.arn
    }
  }
}

resource "aws_lambda_function" "websockets" {
  function_name    = "maestro_websockets"
  role             = "arn:aws:iam::990455710365:role/lambda-import-s3"
  handler          = "lambdas/WebSocket.handler"
  s3_bucket        = aws_s3_bucket.deployment_bucket.id
  s3_key           = aws_s3_bucket_object.object.id
  source_code_hash = data.archive_file.import_lambda_zip.output_base64sha256
  runtime          = "nodejs12.x"
  timeout          = "15"
  memory_size      = "512"

  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }

  environment {
    variables = {
      MAIN_ACCOUNT = var.main_maestro_account
    }
  }
}

resource "aws_lambda_permission" "video_sources_fetch_metadata_permission" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.fetch_metadata.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.insert_video_sources.arn
}

resource "aws_sns_topic_subscription" "video_sources_fetch_metadata" {
  topic_arn = aws_sns_topic.insert_video_sources.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.fetch_metadata.arn
}

resource "aws_lambda_function" "rebuild_cache" {
  function_name    = "maestro_rebuild_cache"
  role             = "arn:aws:iam::990455710365:role/lambda-import-s3"
  handler          = "lambdas/RebuildCache.handler"
  s3_bucket        = aws_s3_bucket.deployment_bucket.id
  s3_key           = aws_s3_bucket_object.object.id
  source_code_hash = data.archive_file.import_lambda_zip.output_base64sha256
  runtime          = "nodejs12.x"
  timeout          = "180"
  memory_size      = "512"

  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }

  environment {
    variables = {
      DB_BUCKET = var.db_bucket
    }
  }
}

resource "aws_lambda_function" "import_to_s3" {
  function_name    = "import_cache_to_s3"
  role             = "arn:aws:iam::990455710365:role/lambda-import-s3"
  handler          = "lambdas/import.handler"
  s3_bucket        = aws_s3_bucket.deployment_bucket.id
  s3_key           = aws_s3_bucket_object.object.id
  source_code_hash = data.archive_file.import_lambda_zip.output_base64sha256
  runtime          = "nodejs12.x"
  timeout          = "900"
  memory_size      = "512"

  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }

  environment {
    variables = {
      SERVER       = "https://gladiator.omny.ca"
      BUCKET       = var.bucket
      DB_BUCKET    = var.db_bucket
      ACCESS_TOKEN = var.access_token
    }
  }
}

resource "aws_lambda_function" "general_image_resizer" {
  function_name    = "maestro_image_resizer"
  role             = "arn:aws:iam::990455710365:role/maestro-lambda"
  handler          = "lambdas/GenericImageResizer.handler"
  s3_bucket        = aws_s3_bucket.deployment_bucket.id
  s3_key           = aws_s3_bucket_object.object.id
  source_code_hash = data.archive_file.import_lambda_zip.output_base64sha256
  runtime          = "nodejs12.x"
  timeout          = "30"
  memory_size      = "1024"

  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }

  environment {
    variables = {
      MAIN_ACCOUNT               = var.main_maestro_account
      KEEP_COPY_IN_SOURCE_BUCKET = "true"
    }
  }
}

resource "aws_sns_topic" "image_resizer_topic" {
  name = "image-resizer-topic"
}

resource "aws_sns_topic_subscription" "image_resizer" {
  topic_arn = aws_sns_topic.image_resizer_topic.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.general_image_resizer.arn
}

resource "aws_lambda_permission" "image_resizer_permission" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.general_image_resizer.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.image_resizer_topic.arn
}

resource "aws_sqs_queue" "image_resizer" {
  name                      = "image-resizer-queue"
  delay_seconds             = 0
  receive_wait_time_seconds = 20
}

resource "aws_sqs_queue" "lambda_dlq" {
  name                      = "lambda-dlq"
  delay_seconds             = 0
  receive_wait_time_seconds = 20
}

#resource "aws_lambda_event_source_mapping" "image_resizer" {
#  event_source_arn = "${aws_sns_topic.image_resizer_topic.arn}"
#  function_name    = "${aws_lambda_function.general_image_resizer.arn}"
#}

#resource "aws_lambda_event_source_mapping" "image_resizer" {
#  event_source_arn = "${aws_sqs_queue.image_resizer.arn}"
#  function_name    = "${aws_lambda_function.general_image_resizer.arn}"
#}

resource "aws_lambda_function" "maestro_web" {
  function_name    = "maestro-web"
  role             = "arn:aws:iam::990455710365:role/maestro-lambda"
  handler          = "lambdas/server.handler"
  s3_bucket        = aws_s3_bucket.deployment_bucket.id
  s3_key           = aws_s3_bucket_object.object.id
  source_code_hash = data.archive_file.import_lambda_zip.output_base64sha256
  runtime          = "nodejs12.x"
  timeout          = "20"
  memory_size      = "512"

  environment {
    variables = {
      SERVER               = "https://gladiator.omny.ca"
      BUCKET               = var.bucket
      DB_BUCKET            = var.db_bucket
      MAIN_ACCOUNT         = var.main_maestro_account
      ALLOW_ADMIN_READONLY = "true"
      BASE_B2_VIDEO_URL    = "https://videos.al.workers.dev/videos"
    }
  }
}

resource "aws_lambda_function" "maestro_admin_web" {
  function_name    = "maestro-admin-web"
  role             = "arn:aws:iam::990455710365:role/maestro-lambda"
  handler          = "admin-lambda.handler"
  s3_bucket        = aws_s3_bucket.deployment_bucket.id
  s3_key           = aws_s3_bucket_object.object.id
  source_code_hash = data.archive_file.import_lambda_zip.output_base64sha256
  runtime          = "nodejs12.x"
  timeout          = "20"
  memory_size      = "512"

  environment {
    variables = {
      SERVER            = "https://gladiator.omny.ca"
      BUCKET            = var.bucket
      DB_BUCKET         = var.db_bucket
      MAIN_ACCOUNT      = var.main_maestro_account
      TMDB_KEY          = var.tmdb_key
      RESIZE_SNS_TOPIC  = aws_sns_topic.image_resizer_topic.arn
      IMAGE_BUCKET      = var.metadata_source_bucket
      CLOUDFLARE_EMAIL  = var.cloudflare_email,
      CLOUDFLARE_KEY    = var.cloudflare_key,
      DNS_ZONE          = var.dns_zone,
      BASE_B2_VIDEO_URL = "https://videos.al.workers.dev/videos",
    }
  }
}

resource "aws_lambda_function" "image_resizer" {
  function_name    = "maestro-image-resizer"
  role             = "arn:aws:iam::990455710365:role/maestro-lambda"
  handler          = "lambdas/MetadataImageResizer.handler"
  s3_bucket        = aws_s3_bucket.deployment_bucket.id
  s3_key           = aws_s3_bucket_object.resizer.id
  source_code_hash = data.archive_file.import_lambda_zip.output_base64sha256
  runtime          = "nodejs12.x"
  timeout          = "30"
  memory_size      = "3008"
  publish          = true
}

resource "aws_api_gateway_rest_api" "maestro" {
  name        = "maestro"
  description = "Proxy to handle requests to our API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_resource" "maestro" {
  rest_api_id = aws_api_gateway_rest_api.maestro.id
  parent_id   = aws_api_gateway_rest_api.maestro.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "method" {
  rest_api_id   = aws_api_gateway_rest_api.maestro.id
  resource_id   = aws_api_gateway_resource.maestro.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "maestro" {
  rest_api_id             = aws_api_gateway_rest_api.maestro.id
  resource_id             = aws_api_gateway_resource.maestro.id
  http_method             = aws_api_gateway_method.method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${data.aws_region.current.name}:lambda:path/2015-03-31/functions/${aws_lambda_function.maestro_web.arn}/invocations"
}

resource "aws_lambda_permission" "apigw_lambda" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.maestro_web.arn
  principal     = "apigateway.amazonaws.com"

  # More: http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-control-access-using-iam-policies-to-invoke-api.html
  source_arn = "${aws_api_gateway_rest_api.maestro.execution_arn}/*/*/*"
}

resource "aws_api_gateway_deployment" "maestro" {
  depends_on = [aws_api_gateway_integration.maestro]

  rest_api_id = aws_api_gateway_rest_api.maestro.id
  stage_name  = "web"
}

data "aws_acm_certificate" "omny" {
  domain      = "*.omny.ca"
  types       = ["AMAZON_ISSUED"]
  most_recent = true
}

resource "aws_s3_bucket" "user_metadata" {
  bucket = var.metadata_user_bucket
  acl    = "private"

  tags = {
    Name = "Maestro resized metadata images"
  }
}

resource "aws_cloudfront_origin_access_identity" "resizer_origin_access_identity" {
  comment = "Maestro resizer"
}

data "aws_iam_policy_document" "resize_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.user_metadata.arn}/*"]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.resizer_origin_access_identity.iam_arn]
    }
  }

  statement {
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.user_metadata.arn]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.resizer_origin_access_identity.iam_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "resize_policy" {
  bucket = aws_s3_bucket.user_metadata.id
  policy = data.aws_iam_policy_document.resize_policy.json
}

resource "aws_cloudfront_distribution" "image_resizer" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "Maestro Metadata Image Resizer"

  origin {
    domain_name = aws_s3_bucket.user_metadata.bucket_regional_domain_name
    origin_id   = "maestroresizer"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.resizer_origin_access_identity.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "maestroresizer"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "allow-all"
    min_ttl                = 0
    default_ttl            = 20
    max_ttl                = 60
  }

  viewer_certificate {
    cloudfront_default_certificate = false
    acm_certificate_arn            = data.aws_acm_certificate.omny.arn
    ssl_support_method             = "sni-only"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  aliases = [var.metadata_user_bucket]
}

