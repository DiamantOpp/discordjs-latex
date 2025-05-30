import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import sharp from 'sharp';
import fs from 'fs';

module.exports = {
    data: new SlashCommandBuilder()
          .setName('latex')
          .setDescription('Generate LaTeX markup.')
          .setIntegrationTypes(0, 1)
          .setContexts(0, 1, 2)
          .addStringOption(option =>
                option.setName('source')
                      .setDescription('LaTeX source')
                      .setRequired(true)
          ),
    execute: async (interaction: ChatInputCommandInteraction, _: {}) => {
        const source = interaction.options.getString('source');
        if (!source) return interaction.reply({content: ':x: No LaTeX provided.', ephemeral: true});
        
        const res = await fetch(`https://latex.codecogs.com/png.image?\\dpi{500} ${source}`);
        if (!res.ok && res.status !== 400) return interaction.reply(`:x: Resource returned HTTP ${res.status} ${res.statusText}`);

        const buffer = Buffer.from(await res.arrayBuffer());

        fs.writeFileSync('latest.png', buffer);

        const { data, info } = await sharp('latest.png').raw().toBuffer({ resolveWithObject: true });
        for (let i = 0; i < data.length; i += info.channels) {
            data[i  ] = 0xff;
            data[i+1] = 0x00;
            data[i+2] = 0x4f;
        }

        await sharp(data, {raw: {width: info.width, height: info.height, channels: info.channels}}).png().toFile('latest.png');
        
        interaction.reply({files: ['latest.png']});
    }
}