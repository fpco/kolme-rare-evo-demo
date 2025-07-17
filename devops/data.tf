data "aws_vpc" "production" {
  tags = {
    Name = "fpco-prod"
  }
}

data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.production.id]
  }

  filter {
    name   = "tag:Tier"
    values = ["PublicEksSubnet"]
  }
}

data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.production.id]
  }

  filter {
    name   = "tag:Tier"
    values = ["PrivateEksSubnet"]
  }
}

data "aws_subnet" "private" {
  for_each = toset(data.aws_subnets.private.ids)
  id       = each.value
}

data "aws_route53_zone" "selected" {
  name         = "prod.fpcomplete.com."
  private_zone = false
}
