const {PubSub} = require("@google-cloud/pubsub")

const pubsubclient = new PubSub();
const subscription_id = "projects/sms-server-10000/subscriptions/number-5858-sub";

const testdata = {
	from_number : "+13177079333",
	to_number : "+13177335858",
	message_body : "Acknowledged post"
}

let data_buf = Buffer.from(JSON.stringify(testdata));

try {
	pubsubclient.topic("number-5858").publishMessage({data: data_buf}).then((messageId) =>{
		console.log(`Message ${messageId} published.`);
	});
  } catch (error) {
    console.error(`Received error while publishing: ${error.message}`);
    process.exitCode = 1;
  }