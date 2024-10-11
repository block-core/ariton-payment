# Ariton Payment

Payment Processing using PhoenixD

## Requirements

- Install and run [PhoenixD](https://github.com/ACINQ/phoenixd/) on local server.
- Clone the repo and run `npm install` and `npm start` to start the server.

## Remote access

If you want to remotely access the phoenixd server, you must start it with arguments to bind to 0.0.0.0:

```sh
./phoenixd --http-bind-ip 0.0.0.0
```

Don't do this unless you have a firewall in place and you know what you are doing. The Payment Processor
is built to run on the same server as PhoenixD and not remotely.

## API

### GET /invoice/?amount=1000&description=description&id=123

### POST /invoice/?amount=1000&description=description&id=123

### GET /decodeinvoice/?invoice=lnbc...

### GET /decodeoffer/?offer=lnbc...

### GET /status

