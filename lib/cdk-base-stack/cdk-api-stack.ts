import * as cdk from '@aws-cdk/core';
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import { Code, Function, Runtime } from '@aws-cdk/aws-lambda';
import { HttpApi, HttpMethod } from '@aws-cdk/aws-apigatewayv2';
import { CfnOutput } from '@aws-cdk/core';
import { InterfaceVpcEndpoint, InterfaceVpcEndpointAwsService, ISecurityGroup } from '@aws-cdk/aws-ec2';
import * as ec2 from '@aws-cdk/aws-ec2';
import { ManagedPolicy } from '@aws-cdk/aws-iam';

export interface CdkApiStackProps extends cdk.StackProps {
    stage: string;
    securityGroup: ISecurityGroup,
    vpc:ec2.Vpc,
    secretName: string
}
export class CdkApiStack extends cdk.Stack {
    public readonly secretEndpoint:InterfaceVpcEndpoint;
    constructor(scope: cdk.Construct, id: string, props: CdkApiStackProps) {
        super(scope, id, props);

        // ###################################################
        // Lambda(s)
        // ###################################################   
        
        // create a lambda given
        // -- the passed in security group
        // -- the given VPC
        // -- the code from the src/get-query folder
        const getQueryFunction = new Function(this, `${props.stage}-GetQueryFunction`, {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: Code.fromAsset('src/get-query'),
            environment: { // update these 
                'SECRET_NAME': props.secretName
            },
            securityGroups: [props.securityGroup],
            vpc: props.vpc,
        })

        // add permission to query secret manager
        getQueryFunction.role?.addManagedPolicy(
            ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite')
        )
        
        this.secretEndpoint = props.vpc.addInterfaceEndpoint('secret-gateway', {
            service: InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
            securityGroups: [props.securityGroup],
        })
        // this.secretEndpoint.connections.allowDefaultPortFrom(getQueryFunction);

        // ###################################################
        // API
        // ###################################################       

        const demoApi = new HttpApi(this, `${props.stage}-DemoApi`)

        const getProxy = new LambdaProxyIntegration({
            handler: getQueryFunction
        })

        demoApi.addRoutes({
            path: '/demo',
            methods: [HttpMethod.GET],
            integration: getProxy
        })

        // ###################################################
        // Outputs
        // ###################################################
        new CfnOutput(this, 'API url', {
            value: demoApi.url!
        })

        new CfnOutput(this, 'Get Function Name', {
            value: getQueryFunction.functionName
        })
    }
}