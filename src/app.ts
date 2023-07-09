import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import irc from 'irc';

console.log("hi");

// Load environment variables
// dotenv.config();
// dotenv.config({ path: "./config/dev.env" });
dotenv.config({ path: path.resolve(__dirname, './config/', 'dev.env') });

console.log("server: " + process.env.IRC_SERVER);


// Define list files
const listFiles = ['channels.txt', 'exceptions.txt', 'abusers.csv', 'botadmins.txt'];

// Load or create lists
const lists = listFiles.map((file) => {
  const filePath = path.resolve(__dirname, './lists/', file);
  if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '');
  }
  return fs.readFileSync(filePath, 'utf-8').split('\n');
});

const [channelList, exceptionList, abusersList, botAdminList] = lists;

console.table(channelList);


// Create IRC client
const client = new irc.Client(process.env.IRC_SERVER!, process.env.BOT_NICKNAME!, {
  userName: 'charlotte',
  realName: 'Charlotte',
  port: 6667,
  // localAddress: null,
  debug: false,
  showErrors: false,
  autoRejoin: false,
  autoConnect: true,
  // channels: [],
  channels: channelList,    
  secure: false,
  selfSigned: false,
  // certExpired: false,
  certExpired: true,
  floodProtection: false,
  floodProtectionDelay: 1000,
  sasl: false,
  retryCount: 0,
  retryDelay: 2000,
  stripColors: false,
  channelPrefixes: "&#",
  messageSplit: 512,
  encoding: ''
});

client.addListener('registered', function() {
  client.send('vhost', process.env.VHOST!, process.env.VHOST_PASSWORD!);
  client.send('oper', process.env.BOT_NICKNAME!, process.env.IRCOP_PASSWORD!);
  client.say('NickServ', `IDENTIFY ${process.env.BOT_PASSWORD}`);
});

client.addListener('message', function(from, to, message) {
  console.log(new Date() + ': ' + from + ' => ' + to + ': ' + message);

  // Check for spam
  // TODO: Implement spam detection// Create a map to store the messages from each user
  const userMessages: {
    [user: string]: { message: string; time: number }[]
  } = {};

  if (!userMessages[from]) {
    userMessages[from] = [];
  }

  userMessages[from].push({ message, time: Date.now() });

  userMessages[from] = userMessages[from].filter(
    (msg) => Date.now() - msg.time < 1000
  );

  if (userMessages[from].length >= 3) {
    console.log("Spammer: " + from);
  }


  // Check for commands
  if (message.startsWith('!')) {
    const args = message.substring(1).split(' ');
    const cmd = args[0];

    switch (cmd) {
      case 'help':
        client.say(from, 'Help: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.');
        break;
      case 'abusers':
        client.say(from, 'Abusers: ' + abusersList.join(', '));
        break;
      case 'unban':
        if (botAdminList.includes(from)) {
            const nickname = args[1];
            // TODO: Implement unban logic
        }
        break;
    }
}
});
