module "ec2-bastion" {
  source  = "terraform-aws-modules/ec2-instance/aws"
  version = "6.0.2"

  create = true

  name                        = "db-bastion"
  ami                         = "ami-07041441b708acbd6"
  instance_type               = "t4g.nano"
  subnet_id                   = local.private_subnet_ids[0]
  vpc_security_group_ids      = [module.security_group.security_group_id]
  associate_public_ip_address = false

  root_block_device = {
      volume_type = "gp3"
      volume_size = 10
  }
}

module "security_group" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.1.2"

  name        = "db-sg"
  description = "Security group for Bastion"
  vpc_id      = local.vpc_id

  ingress_cidr_blocks = ["0.0.0.0/0"]

  computed_ingress_rules           = ["ssh-tcp"]
  number_of_computed_ingress_rules = 1

  egress_rules = ["all-all"]

}

resource "aws_ec2_instance_connect_endpoint" "bastion" {
  subnet_id          = local.private_subnet_ids[0]
  security_group_ids = [module.security_group.security_group_id]
}
