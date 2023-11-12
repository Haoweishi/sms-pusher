const {PubSub} = require("@google-cloud/pubsub")
const child_process = require("node:child_process");
const fs = require("node:fs");

let config_json = null;

try {
	let config_json_str = fs.readFileSync("config.json", "utf-8");
	config_json = JSON.parse(config_json_str);
} catch(config_load_exception) {
	console.log("Config.json not found or not properly formatted. Exiting.");
	process.exit();
}


const pubsubclient = new PubSub();
const subscription_id = config_json.subscriptionId;
const sub = pubsubclient.subscription(subscription_id);
const local_number = config_json.localNumber;
console.log("Local number is : " + local_number);


const startup_command = "mmcli --list-modems -J";
let modemlist = null;

try {
	let modemcheck = child_process.execSync(startup_command, {encoding:"utf-8"});
	modemlist = JSON.parse(modemcheck);
} catch(first_check_exception) {
	console.log("MMCLI Output Cannot be parsed, check installation.");
	process.exit();
}

let active_modem = null;

if (modemlist["modem-list"].length == 0) {
console.error("No modems detected.");
exit();
} else {
let selected = modemlist["modem-list"][0]
console.log("Detection success, using: " + selected);
active_modem = selected
}

function send_sms(to_number, message_body) {
message_body = message_body.replaceAll("\"", "\'")
message_body = message_body.replaceAll("'", "'\\''")
let text_template = `text="${message_body}\",number=${to_number}`;
let create_msg_cmd = `mmcli -m ${active_modem} --messaging-create-sms='${text_template}' -J`;
console.log(create_msg_cmd);
let modemresp = child_process.execSync(create_msg_cmd, {encoding:"utf-8"});
let unsent_msg_path = modemresp.split(":")[1]
unsent_msg_path = unsent_msg_path.replace(/\r?\n|\r/g, " ");
console.log(unsent_msg_path);
let send_msg_cmd = `mmcli -s ${unsent_msg_path} --send`
modemresp = child_process.execSync(send_msg_cmd, {encoding:"utf-8"});
console.log(modemresp);
}

sub.on("message", function(message) {
	let msg_obj = JSON.parse(message.data.toString());
	if (msg_obj.from_number === local_number) {
	   console.log("Begin to send msg to: " + msg_obj.to_number);
	   send_sms(msg_obj.to_number, msg_obj.message_body);
	}
	message.ack()
});
