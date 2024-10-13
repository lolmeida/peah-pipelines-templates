output "cluster_endpoint_address" {
  description = "DNS hostname of the cluster configuration endpoint"
  value       = try(aws_memorydb_cluster.memorydb_cluster_group.cluster_endpoint[0].address, "NOT_SET")
}