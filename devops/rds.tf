module "processor" {
  source  = "terraform-aws-modules/rds-aurora/aws"
  version = "~> 9.9.0"

  name           = "processor"
  engine         = "aurora-postgresql"
  engine_version = "17.5"
  instance_class = "db.t3.medium"
  instances = {
    one = {
      instance_class = "db.t3.medium"
    }
  }

  preferred_maintenance_window = "Mon:00:00-Mon:03:00"
  preferred_backup_window      = "03:00-06:00"

  security_group_rules = {
    vpc_ingress = {
      type        = "ingress"
      protocol    = "tcp"
      cidr_blocks = [local.vpc_cidr_ipv4]
      from_port   = 5432
      to_port     = 5432
      description = "PostgreSQL security group for processor RDS and vpc"
    }
  }

  master_username                                        = "postgres"
  manage_master_user_password                            = true
  manage_master_user_password_rotation                   = true
  master_user_password_rotate_immediately                = false
  master_user_password_rotation_automatically_after_days = 90
  deletion_protection                                    = true

  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  backup_retention_period               = 7

  vpc_id                 = local.vpc_id
  create_db_subnet_group = true
  subnets                = local.private_subnet_ids

  storage_encrypted          = true
  apply_immediately          = true
  skip_final_snapshot        = false
  create_monitoring_role     = true
  monitoring_interval        = 60
  auto_minor_version_upgrade = false
}
