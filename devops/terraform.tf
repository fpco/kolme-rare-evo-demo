terraform {
  required_version = "1.12.2"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.3.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5.3"
    }
  }
  backend "s3" {
    bucket  = "fpco-remote-state"
    key     = "fpcomplete/ecs/rare-evo-demo.tfstate"
    region  = "us-east-1"
    profile = "production"
  }
}

provider "aws" {
  region  = "us-east-1"
  profile = "production"

  default_tags {
    tags = {
      Project     = "rare-evo"
      Environment = "prod"
    }
  }
}
