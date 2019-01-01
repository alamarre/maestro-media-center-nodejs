terraform {
  required_version = "= 0.11.8"
  backend "s3" {
    bucket = "terraform.omny.ca"
    key    = "lambdas"
    region = "us-east-1"
  }
}

provider "aws" {
  region              = "us-east-1"
  profile             = "maestro-terraform"
  allowed_account_ids = ["990455710365"]
}

data "aws_region" "current" {}

data "aws_caller_identity" "current" {}

data "archive_file" "import_lambda_zip" {
    type        = "zip"
    source_dir  = "${path.module}/../../build/"
    output_path = "${path.module}/import_lambda.zip"
}

resource "aws_s3_bucket" "deployment_bucket" {
  bucket = "${var.deployment_bucket}"
  acl    = "private"
}

resource "aws_s3_bucket_object" "object" {
  bucket = "${aws_s3_bucket.deployment_bucket.id}"
  key    = "${data.archive_file.import_lambda_zip.output_base64sha256}"
  source = "${data.archive_file.import_lambda_zip.output_path}"
  etag   = "${data.archive_file.import_lambda_zip.output_base64sha256}"
}

resource "aws_lambda_function" "maintain_cache" {
  function_name    = "maestro_maintain_cache"
  role             = "arn:aws:iam::990455710365:role/lambda-import-s3"
  handler          = "src/lambdas/MaintainCache.handler"
  s3_bucket = "${aws_s3_bucket.deployment_bucket.id}"
  s3_key = "${aws_s3_bucket_object.object.id}"
  source_code_hash = "${data.archive_file.import_lambda_zip.output_base64sha256}"
  runtime          = "nodejs8.10"
  timeout = "15"
  memory_size = "512"

  environment {
    variables = {
      DB_BUCKET = "${var.db_bucket}"
    }
  }
}

resource "aws_lambda_function" "vide_added_time" {
  function_name    = "maestro_video_added_time"
  role             = "arn:aws:iam::990455710365:role/lambda-import-s3"
  handler          = "src/lambdas/NewVideoTimeAdded.handler"
  s3_bucket = "${aws_s3_bucket.deployment_bucket.id}"
  s3_key = "${aws_s3_bucket_object.object.id}"
  source_code_hash = "${data.archive_file.import_lambda_zip.output_base64sha256}"
  runtime          = "nodejs8.10"
  timeout = "15"
  memory_size = "512"

  environment {
    variables = {
      DB_BUCKET = "${var.db_bucket}"
    }
  }
}

resource "aws_lambda_function" "fetch_metadata" {
  function_name    = "maestro_fetch_metadata_from_dynamo_stream"
  role             = "arn:aws:iam::990455710365:role/lambda-import-s3"
  handler          = "src/lambdas/FetchMetadata.handler"
  s3_bucket = "${aws_s3_bucket.deployment_bucket.id}"
  s3_key = "${aws_s3_bucket_object.object.id}"
  source_code_hash = "${data.archive_file.import_lambda_zip.output_base64sha256}"
  runtime          = "nodejs8.10"
  timeout = "15"
  memory_size = "512"

  environment {
    variables = {
      DB_BUCKET = "${var.db_bucket}",
      IMAGE_BUCKET = "${var.image_bucket}",
      TMDB_KEY = "${var.tmdb_key}"
    }
  }
}

resource "aws_lambda_function" "rebuild_cache" {
  function_name    = "maestro_rebuild_cache"
  role             = "arn:aws:iam::990455710365:role/lambda-import-s3"
  handler          = "src/lambdas/RebuildCache.handler"
  s3_bucket = "${aws_s3_bucket.deployment_bucket.id}"
  s3_key = "${aws_s3_bucket_object.object.id}"
  source_code_hash = "${data.archive_file.import_lambda_zip.output_base64sha256}"
  runtime          = "nodejs8.10"
  timeout = "180"
  memory_size = "512"

  environment {
    variables = {
      DB_BUCKET = "${var.db_bucket}"
    }
  }
}


resource "aws_lambda_function" "import_to_s3" {
  function_name    = "import_cache_to_s3"
  role             = "arn:aws:iam::990455710365:role/lambda-import-s3"
  handler          = "src/lambdas/import.handler"
  s3_bucket = "${aws_s3_bucket.deployment_bucket.id}"
  s3_key = "${aws_s3_bucket_object.object.id}"
  source_code_hash = "${data.archive_file.import_lambda_zip.output_base64sha256}"
  runtime          = "nodejs8.10"
  timeout = "900"
  memory_size = "512"

  environment {
    variables = {
      SERVER = "https://gladiator.omny.ca",
      BUCKET = "${var.bucket}",
      DB_BUCKET = "${var.db_bucket}",
      ACCESS_TOKEN = "${var.access_token}"
    }
  }
}

resource "aws_lambda_function" "maestro_web" {
  function_name    = "maestro-web"
  role             = "arn:aws:iam::990455710365:role/maestro-lambda"
  handler          = "src/lambda.handler"
  s3_bucket = "${aws_s3_bucket.deployment_bucket.id}"
  s3_key = "${aws_s3_bucket_object.object.id}"
  source_code_hash = "${data.archive_file.import_lambda_zip.output_base64sha256}"
  runtime          = "nodejs8.10"
  timeout = "20"
  memory_size = "512"

  environment {
    variables = {
      SERVER = "https://gladiator.omny.ca",
      BUCKET = "${var.bucket}",
      DB_BUCKET = "${var.db_bucket}"
    }
  }
}

data "aws_acm_certificate" "maestro" {
  domain      = "${var.domain}"
  types       = ["AMAZON_ISSUED"]
  most_recent = true
}

resource "aws_api_gateway_domain_name" "maestro" {
  domain_name              = "${var.domain}"
  regional_certificate_arn = "${data.aws_acm_certificate.maestro.arn}"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_rest_api" "maestro" {
    name = "maestro"
    description = "Proxy to handle requests to our API"

    endpoint_configuration {
        types = ["REGIONAL"]
    }
}

resource "aws_api_gateway_resource" "maestro" {
  rest_api_id = "${aws_api_gateway_rest_api.maestro.id}"
  parent_id   = "${aws_api_gateway_rest_api.maestro.root_resource_id}"
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "method" {
  rest_api_id   = "${aws_api_gateway_rest_api.maestro.id}"
  resource_id   = "${aws_api_gateway_resource.maestro.id}"
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "maestro" {
  rest_api_id             = "${aws_api_gateway_rest_api.maestro.id}"
  resource_id             = "${aws_api_gateway_resource.maestro.id}"
  http_method             = "${aws_api_gateway_method.method.http_method}"
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${data.aws_region.current.name}:lambda:path/2015-03-31/functions/${aws_lambda_function.maestro_web.arn}/invocations"
}

resource "aws_lambda_permission" "apigw_lambda" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.maestro_web.arn}"
  principal     = "apigateway.amazonaws.com"

  # More: http://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-control-access-using-iam-policies-to-invoke-api.html
  source_arn = "${aws_api_gateway_rest_api.maestro.execution_arn}/*/*/*"
}

resource "aws_api_gateway_deployment" "maestro" {
  depends_on = ["aws_api_gateway_integration.maestro"]

  rest_api_id = "${aws_api_gateway_rest_api.maestro.id}"
  stage_name  = "web"
}

resource "aws_route53_record" "maestro" {
  name    = "${aws_api_gateway_domain_name.maestro.domain_name}"
  type    = "A"
  zone_id = "${var.route53_zone}"

  alias {
    evaluate_target_health = false
    name                   = "${aws_api_gateway_domain_name.maestro.regional_domain_name}"
    zone_id                = "${aws_api_gateway_domain_name.maestro.regional_zone_id}"
  }
}
