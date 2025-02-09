const { Server, RCON, MasterServer } = require('@fabricio-191/valve-server-query');

const filter = new MasterServer.Filter()
    .add('appid', 252490)
    .addNAND(new MasterServer.Filter()
        .addFlag('noplayers'))

MasterServer({
    quantity: 1000, // or Infinity or 'all'
    region: 'OTHER',
    timeout: 3000,
    filter,
}).then(async servers => {
    let [ip, port] = servers[0].split(':');

    const server = await Server({
        ip,
        port: Number(port),
        timeout: 3000,
    });

    const info  = await server.getInfo()
    const players  = await server.getPlayers()
    const rules  = await server.getRules()
    console.log(info);

})
    .catch(console.error);
