node_type                   = "db.t4g.medium"
number_of_replicas_by_shard = 2
service_vpc_name            = "iis-prod"
product_vpc_name            = "product-resources-iis-prod"
region                      = "US"
aws_region                  = "us-east-1"
availability_zones          = ["us-east-1a", "us-east-1b", "us-east-1c"]
snapshot_window             = "03:00-05:00"
event_rule_schedule         = "cron(45 5 * * ? *)"