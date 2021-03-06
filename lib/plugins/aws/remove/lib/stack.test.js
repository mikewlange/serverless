'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const AwsProvider = require('../../provider/awsProvider');
const AwsRemove = require('../index');
const Serverless = require('../../../../Serverless');
const BbPromise = require('bluebird');

describe('removeStack', () => {
  const serverless = new Serverless();
  serverless.service.service = 'removeStack';
  serverless.setProvider('aws', new AwsProvider(serverless));

  let awsRemove;
  let removeStackStub;

  beforeEach(() => {
    const options = {
      stage: 'dev',
      region: 'us-east-1',
    };
    awsRemove = new AwsRemove(serverless, options);
    awsRemove.serverless.cli = new serverless.classes.CLI();
    removeStackStub = sinon.stub(awsRemove.provider, 'request').returns(BbPromise.resolve());
  });

  describe('#remove()', () => {
    it('should remove a stack', () =>
      awsRemove.remove().then(() => {
        expect(removeStackStub.calledOnce).to.be.equal(true);
        expect(removeStackStub.calledWithExactly(
          'CloudFormation',
          'deleteStack',
          {
            StackName: `${serverless.service.service}-${awsRemove.options.stage}`,
          },
          awsRemove.options.stage,
          awsRemove.options.region
        )).to.be.equal(true);
        awsRemove.provider.request.restore();
      })
    );

    it('should use CloudFormation service role if it is specified', () => {
      awsRemove.serverless.service.provider.cfnRole = 'arn:aws:iam::123456789012:role/myrole';

      return awsRemove.remove().then(() => {
        expect(removeStackStub.args[0][2].RoleARN)
          .to.equal('arn:aws:iam::123456789012:role/myrole');
        awsRemove.provider.request.restore();
      });
    });
  });

  describe('#removeStack()', () => {
    it('should run promise chain in order', () => {
      const removeStub = sinon
        .stub(awsRemove, 'remove').returns(BbPromise.resolve());

      return awsRemove.removeStack().then(() => {
        expect(removeStub.calledOnce).to.be.equal(true);
        awsRemove.remove.restore();
      });
    });
  });
});
