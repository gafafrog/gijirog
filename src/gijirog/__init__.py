import logging
import os

import discord
from discord import app_commands


logger = logging.getLogger(__name__)


class GijirogClient(discord.Client):
    def __init__(self, guild_id: int) -> None:
        super().__init__(intents=discord.Intents.default())
        self.guild_id = guild_id
        self.tree = app_commands.CommandTree(self)

    async def setup_hook(self) -> None:
        guild = discord.Object(id=self.guild_id)
        self.tree.copy_global_to(guild=guild)
        await self.tree.sync(guild=guild)


def build_client(guild_id: int) -> GijirogClient:
    client = GijirogClient(guild_id=guild_id)

    @client.tree.command(name="ping", description="Health check — replies with pong.")
    async def ping(interaction: discord.Interaction) -> None:
        await interaction.response.send_message("pong")

    @client.event
    async def on_ready() -> None:
        logger.info("Logged in as %s (id=%s)", client.user, client.user.id if client.user else "?")

    return client


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    token = os.environ.pop("DISCORD_TOKEN")
    guild_id = int(os.environ["DISCORD_GUILD_ID"])

    client = build_client(guild_id=guild_id)
    client.run(token, log_handler=None)
