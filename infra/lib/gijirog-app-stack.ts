import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as scheduler from 'aws-cdk-lib/aws-scheduler';
import * as schedulerTargets from 'aws-cdk-lib/aws-scheduler-targets';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export class GijirogAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const repository = new ecr.Repository(this, 'AppRepository', {
      repositoryName: 'gijirog',
      imageTagMutability: ecr.TagMutability.MUTABLE,
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });

    // Reuse the account's default VPC (public subnets only) — no NAT, no extra
    // network resources to pay for. Requires AWS creds at synth (context lookup).
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', { isDefault: true });

    const cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: 'gijirog',
      vpc,
    });

    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: '/gijirog/dev',
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      family: 'gijirog',
      cpu: 256,
      memoryLimitMiB: 512,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.ARM64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    const discordToken = ssm.StringParameter.fromSecureStringParameterAttributes(
      this,
      'DiscordToken',
      { parameterName: '/gijirog/dev/DISCORD_TOKEN' },
    );
    const discordGuildId = ssm.StringParameter.fromStringParameterName(
      this,
      'DiscordGuildId',
      '/gijirog/dev/DISCORD_GUILD_ID',
    );

    taskDefinition.addContainer('Bot', {
      image: ecs.ContainerImage.fromEcrRepository(repository, 'dev'),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'gijirog', logGroup }),
      secrets: {
        DISCORD_TOKEN: ecs.Secret.fromSsmParameter(discordToken),
        DISCORD_GUILD_ID: ecs.Secret.fromSsmParameter(discordGuildId),
      },
    });

    // Outbound-only Bot: no ingress at all, egress left fully open (default).
    const securityGroup = new ec2.SecurityGroup(this, 'ServiceSg', {
      vpc,
      description: 'gijirog bot - egress only, no inbound',
      allowAllOutbound: true,
    });

    const service = new ecs.FargateService(this, 'Service', {
      serviceName: 'gijirog',
      cluster,
      taskDefinition,
      desiredCount: 0,
      assignPublicIp: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroups: [securityGroup],
    });

    // 消し忘れ保険: 毎晩 21:00 (America/Los_Angeles) に service を
    // desiredCount=0 へ落とす。アイドル判定はせず、時間が来たら問答無用で停止。
    // up は人手 (scripts/bot.sh up) のまま = 非対称な安全装置。
    new scheduler.Schedule(this, 'NightlyShutdown', {
      scheduleName: 'gijirog-nightly-shutdown',
      description: 'Force gijirog ECS service to desiredCount=0 every night (cost guard).',
      schedule: scheduler.ScheduleExpression.cron({
        minute: '0',
        hour: '21',
        timeZone: cdk.TimeZone.AMERICA_LOS_ANGELES,
      }),
      target: new schedulerTargets.Universal({
        service: 'ecs',
        action: 'updateService',
        input: scheduler.ScheduleTargetInput.fromObject({
          Cluster: cluster.clusterName,
          Service: service.serviceName,
          DesiredCount: 0,
        }),
        // 既定は全リソース許可になりがちなので、自分の service ARN に絞る。
        policyStatements: [
          new iam.PolicyStatement({
            actions: ['ecs:UpdateService'],
            resources: [service.serviceArn],
          }),
        ],
      }),
    });
  }
}
