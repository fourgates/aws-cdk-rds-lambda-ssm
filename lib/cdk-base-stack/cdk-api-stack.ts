import * as cdk from '@aws-cdk/core';
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import { Code, Function, Runtime } from '@aws-cdk/aws-lambda';
import { HttpApi, HttpMethod } from '@aws-cdk/aws-apigatewayv2';
import { CfnOutput } from '@aws-cdk/core';
import { ISecurityGroup } from '@aws-cdk/aws-ec2';
import * as ec2 from '@aws-cdk/aws-ec2';

export interface CdkApiStackProps extends cdk.StackProps {
    stage: string;
    securityGroup: ISecurityGroup,
    vpc:ec2.Vpc
}
export class CdkApiStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: CdkApiStackProps) {
        super(scope, id, props);

        // ###################################################
        // Lambda(s)
        // ###################################################      

        const getQueryFunction = new Function(this, `${props.stage}-GetQueryFunction`, {
            runtime: Runtime.NODEJS_14_X,
            handler: 'app.handler',
            code: Code.fromAsset('src/get-query'),
            environment: { // update these 
                'TRANSLATE_BUS': ""
            },
            securityGroups: [props.securityGroup],
            vpc: props.vpc,
        })

        // ###################################################
        // API
        // ###################################################       

        // TODO - update name
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