#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { Construct } from '@aws-cdk/core';
import { CdkApiStack, CdkApiStackProps } from '../lib/cdk-base-stack/cdk-api-stack';
import { CdkBaseStack, CdkBaseStackProps } from '../lib/cdk-base-stack/cdk-base-stack';

class DemoApp extends Construct{
    constructor(scope: cdk.App, id:string){
        super(scope,id);
        // create a small vpc for the demo
        const vpcProps: CdkBaseStackProps = {
            stage: id, 
            description: "Base VPC for AWS Cloud Application",
            yourIpAddres: "",
            tags: {env: id},
            stackName: `PublicVpcStack-${id}` // used in cloudformation for naming stack
        }        

        const base:CdkBaseStack = new CdkBaseStack(this, `CdkVpcStack-${id}`,
            vpcProps);

        // create an API            
        const apiProps: CdkApiStackProps = {
            stage: id,
            securityGroup: base.defaultSecurityGroup,
            vpc: base.vpc,
            secretName: base.databaseCredentialsSecret.secretName
        }            

        const api: CdkApiStack = new CdkApiStack(this, `CdkApiStack-${id}`,
            apiProps);
    }
}
const app = new cdk.App();
new DemoApp(app, 'dev');