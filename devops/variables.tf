variable "HEALTH_CHECK_SLACK_WEBHOOK" {
  description = "Slack webhook URL for sending health check notifications."
  type        = string
  sensitive   = true
}

variable "RNG_SERVER_SIGNING_KEY" {
  description = "The private key used to sign tokens for the RNG server."
  type        = string
  sensitive   = true
}

variable "RNG_SERVER_HMAC_SECRET" {
  description = "The HMAC secret used for message authentication in the RNG server."
  type        = string
  sensitive   = true
}

variable "KOLME_POSTGRES_STORE" {
  description = "Postgres credential for Postgres Store"
  type        = string
  sensitive   = true
}

variable "VALIDATOR_SECRET_KEY" {
  description = "Validator secret key"
  type        = string
  sensitive   = true
}
