terraform {
  backend "s3" {
    bucket  = "terraform.omny.ca"
    profile = "maestro-terraform"
    key     = "ecr"
    region  = "us-east-1"
  }
}

provider "aws" {
  region  = "us-east-1"
  profile = "maestro-terraform"
}

