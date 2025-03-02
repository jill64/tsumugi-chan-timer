import { App, Stack, StackProps, aws_ec2, aws_ecs } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import 'dotenv/config'
import { env } from 'node:process'

class CDKStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const vpc = new aws_ec2.Vpc(this, 'TsumugiChanTimerVpc', {
      maxAzs: 2
    })

    const cluster = new aws_ecs.Cluster(this, 'TsumugiChanTimerEcsCluster', {
      vpc
    })

    const taskDefinition = new aws_ecs.FargateTaskDefinition(
      this,
      'TsumugiChanTimerTaskDef',
      {
        memoryLimitMiB: 512,
        cpu: 256
      }
    )

    const container = taskDefinition.addContainer('TsumugiChanTimerContainer', {
      image: aws_ecs.ContainerImage.fromAsset('dist/tsumugi-chan-timer'),
      logging: aws_ecs.LogDrivers.awsLogs({ streamPrefix: 'TsumugiChanTimer' }),
      environment: {
        DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN!,
        SOLARSYSTEM_API_KEY: process.env.SOLARSYSTEM_API_KEY!
      }
    })

    container.addPortMappings({
      containerPort: 80
    })

    new aws_ecs.FargateService(this, 'TsumugiChanTimerFargateService', {
      cluster,
      taskDefinition,
      desiredCount: 1
    })
  }
}

const app = new App()

new CDKStack(app, 'TsumugiChanTimer', {
  env: {
    account: env.CDK_DEFAULT_ACCOUNT,
    region: env.CDK_DEFAULT_REGION
  }
})
