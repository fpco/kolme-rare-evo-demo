module "route53_records" {
  source  = "terraform-aws-modules/route53/aws//modules/records"
  version = "2.10.2"

  for_each = {
    rng = {
      domain_prefix = "rng",
      record        = module.alb.dns_name
    }
  }

  zone_id = data.aws_route53_zone.selected.zone_id
  records = [
    {
      name    = each.value.domain_prefix
      type    = "CNAME"
      ttl     = 5
      records = [each.value.record]
    }
  ]
}

module "acm" {
  source  = "terraform-aws-modules/acm/aws"
  version = "4.3.2"

  for_each = {
    rng = {
      domain_name = "rng.prod.fpcomplete.com",
    }
  }

  create_route53_records = true
  zone_id                = data.aws_route53_zone.selected.zone_id
  domain_name            = each.value.domain_name
}
