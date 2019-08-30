import cdk = require('@aws-cdk/core');
import s3 = require('@aws-cdk/aws-s3');
import cloudfront = require('@aws-cdk/aws-cloudfront');
import { environment } from '../environments/environment';
import route53 = require('@aws-cdk/aws-route53');
import certificatemanager = require('@aws-cdk/aws-certificatemanager');
import iam = require('@aws-cdk/aws-iam');

export class StaticSiteStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const certificate = certificatemanager.Certificate.fromCertificateArn(this, 'Certificate', environment.certificateARN);
    const originAccessIdentity = new cloudfront.CfnCloudFrontOriginAccessIdentity(this, 'MyOriginAccess', { 
      cloudFrontOriginAccessIdentityConfig: {
        comment: environment.originAccessIdentityName
      }
    });

    const corporateBucket = new s3.Bucket(this, environment.bucketName, {bucketName: environment.bucketName});
    corporateBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [corporateBucket.arnForObjects('index.html')],
      principals: [new iam.AccountRootPrincipal()],
    }));

    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'MyDistribution', {
      originConfigs: [
          {
            s3OriginSource: {
                s3BucketSource: corporateBucket,
                /**
                 * TODO
                 * This line does not setup the access identity correctly. Not sure if this is something
                 * we have done or if it is a limitation of the CDK at the moment.
                 * 
                 * All of the Cloudfront constructs are marked as "public beta" as of version 1.4
                 */
                originAccessIdentityId: originAccessIdentity.logicalId
            },
            behaviors : [ {isDefaultBehavior: true}]
          }
      ],
      aliasConfiguration: {
        acmCertRef: certificate.certificateArn,
            names: [`${environment.subdomainName}.${environment.domainName}`],
            securityPolicy: cloudfront.SecurityPolicyProtocol.SSL_V3,
            sslMethod: cloudfront.SSLMethod.SNI
      }
    });

    const zone = route53.HostedZone.fromLookup(this, 'MyZone', { domainName: environment.hostedZoneName });  
    new route53.CnameRecord(this, 'CNAME', {domainName: distribution.domainName, zone: zone, recordName: environment.subdomainName});

  }
}
