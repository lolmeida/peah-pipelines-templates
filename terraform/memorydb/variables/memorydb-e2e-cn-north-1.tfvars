node_type                   = "db.t4g.small"
number_of_replicas_by_shard = 2
service_vpc_name            = "iis-cn-e2e"
product_vpc_name            = "product-resources-iis-cn-e2e"
region                      = "CN"
aws_region                  = "cn-north-1"
availability_zones          = ["cn-north-1a", "cn-north-1b"]
snapshot_window             = "14:00-16:00"
event_rule_schedule         = "cron(45 16 * * ? *)"