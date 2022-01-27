const discord = require("discord.js");
const client = new discord.Client()
const { prefix, ServerID } = require("./config.json")
const config = require('./config.json');

client.on("ready", () => {

    console.log("Bot activo!")
    client.user.setActivity(config.status)
})



client.on("channelDelete", (channel) => {
    if (channel.parentID == channel.guild.channels.cache.find((x) => x.name == config.categoria).id) {
        const person = channel.guild.members.cache.find((x) => x.id == channel.name)

        if (!person) return;

        let yembed = new discord.MessageEmbed()
            .setAuthor("MAIL DELETED", client.user.displayAvatarURL())
            .setColor('RED')
            .setDescription("Your mail was deleted by a staff member!")
        return person.send(yembed)

    }


})





client.on("message", async message => {
    if (message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    let command = args.shift().toLowerCase();


    if (message.guild) {

        if (command == config.setupCommand) {
            if (!message.content.startsWith(prefix)) return;
            if (!message.member.hasPermission("ADMINISTRATOR")) {
                return message.channel.send("Necesitas permisos de administrador para ejecutar este comando")
            }

            if (!message.guild.me.hasPermission("ADMINISTRATOR")) {
                return message.channel.send("El bot necesita permisos de administrador para este comando")
            }


            let role = message.guild.roles.cache.find((x) => x.name == config.rol)
            let everyone = message.guild.roles.cache.find((x) => x.name == "@everyone")

            if (!role) {
                role = await message.guild.roles.create({
                    data: {
                        name: config.rol,
                        color: "YELLOW"
                    },
                    reason: "Rol para el Mod-Mail"
                })
            }

            await message.guild.channels.create(config.categoria, {
                type: "category",
                topic: "Todos los tickts estaran aqui",
                permissionOverwrites: [
                    {
                        id: role.id,
                        allow: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"]
                    },
                    {
                        id: everyone.id,
                        deny: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"]
                    }
                ]
            })


            return message.channel.send("Configuracion terminada")

        } else if (command == config.closeCommand) {
            if (!message.content.startsWith(prefix)) return;
            if (!message.member.roles.cache.find((x) => x.name == config.rol)) {
                return message.channel.send("Necesitas ser un staff para este comando")
            }
            if (message.channel.parentID == message.guild.channels.cache.find((x) => x.name == config.categoria).id) {

                const person = message.guild.members.cache.get(message.channel.name)

                if (!person) {
                    return message.channel.send("No puedo cerrar este ticket, puede deberse a que se ha cambiado el nombre del mismo")
                }

                await message.channel.delete()

                let yembed = new discord.MessageEmbed()
                    .setAuthor("Ticket Cerrado", client.user.displayAvatarURL())
                    .setColor("RED")
                    .setThumbnail(client.user.displayAvatarURL())
                    .setFooter("Staff: " + message.author.username)
                if (args[0]) yembed.setDescription(`Razon: ${args.join(" ")}`)

                return person.send(yembed)

            }
        } else if (command == config.openCommand) {
            if (!message.content.startsWith(prefix)) return;
            const category = message.guild.channels.cache.find((x) => x.name == config.categoria)

            if (!category) {
                return message.channel.send("No se ha establecido el sistema de tickets en este servidor, utilize " + prefix + config.setupCommand)
            }

            if (!message.member.roles.cache.find((x) => x.name == config.rol)) {
                return message.channel.send("Necesitas ser staff para ejecutar este comando")
            }

            if (isNaN(args[0]) || !args.length) {
                return message.channel.send("Necesitas introducir una ID")
            }

            const target = message.guild.members.cache.find((x) => x.id === args[0])

            if (!target) {
                return message.channel.send("No he encontrado ese usuario")
            }


            const channel = await message.guild.channels.create(target.id, {
                type: "text",
                parent: category.id,
                topic: "Ticket abierto por **" + message.author.username + "** para contactarse con " + message.author.tag
            })

            let nembed = new discord.MessageEmbed()
                .setAuthor("Detalles", target.user.displayAvatarURL({ dynamic: true }))
                .setColor("BLUE")
                .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
                .setDescription(message.content)
                .addField("NNombre", target.user.username)
                .addField("Cuenta creada", target.user.createdAt)


            channel.send(nembed)

            let uembed = new discord.MessageEmbed()
                .setAuthor("Ticket abierto")
                .setColor("GREEN")
                .setThumbnail(client.user.displayAvatarURL())
                .setDescription("Has sido contactado por el staff de **" + message.guild.name + "**, Espera a que ellos te digan algo importante");


            target.send(uembed);

            let newEmbed = new discord.MessageEmbed()
                .setDescription("He abierto el ticket: <#"+channel+">")
                .setColor("GREEN");

            return message.channel.send(newEmbed);
        } else if (command == config.comandoHelp) {
            if (!message.content.startsWith(prefix)) return;
            let embed = new discord.MessageEmbed()
                .setAuthor('MODMAIL BOT') 
                .addField("$setup", "Setup the modmail system(This is not for multiple server.)", true)

                .addField("$open", 'Let you open the mail to contact anyone with his ID', true)
                .setThumbnail(client.user.displayAvatarURL())
                .addField("$close", "Close the mail in which you use this command.", true);

            return message.channel.send(embed)

        }
    }







    if (message.channel.parentID) {

        const category = message.guild.channels.cache.find((x) => x.name == config.categoria)

        if (message.channel.parentID == category.id) {
            let member = message.guild.members.cache.get(message.channel.name)

            if (!member) return message.channel.send('No se ha podido enviar el mensaje')

            let lembed = new discord.MessageEmbed()
                .setColor("GREEN")
                .setAuthor(message.author.username, message.author.displayAvatarURL({ dynamic: true }))
                .setDescription(message.content)

            return member.send(lembed)
        }


    }

    if (!message.guild) {
        const guild = await client.guilds.cache.get(ServerID) || await client.guilds.fetch(ServerID).catch(m => { })
        if (!guild) return;
        const category = guild.channels.cache.find((x) => x.name == config.categoria)
        if (!category) return;
        const main = guild.channels.cache.find((x) => x.name == message.author.id)


        if (!main) {
            let mx = await guild.channels.create(message.author.id, {
                type: "text",
                parent: category.id,
                topic: "Este ticket fue creado para ayudar a  **" + message.author.tag + " **"
            })

            let sembed = new discord.MessageEmbed()
                .setAuthor("Ticket abierto")
                .setColor("GREEN")
                .setThumbnail(client.user.displayAvatarURL())
                .setDescription("Te has contactado correctamente, por favor, espera")

            message.author.send(sembed)


            let eembed = new discord.MessageEmbed()
                .setAuthor("Detalles", message.author.displayAvatarURL({ dynamic: true }))
                .setColor("BLUE")
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                .setDescription(message.content)
                .addField("Nombre", message.author.username)
                .addField("Cuenta creada el", message.author.createdAt)


            return mx.send(eembed)
        }

        let xembed = new discord.MessageEmbed()
            .setColor("RED")
            .setAuthor(message.author.tag, message.author.displayAvatarURL({ dynamic: true }))
            .setDescription(message.content)


        main.send(xembed)

    }




})


client.login(config.token)
