fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'marvosa-cad'
author 'MarvosaCAD'
description 'Connects a FiveM server to the MarvosaCAD dispatch console'
version '1.0.0'

shared_script 'config.lua'
server_script 'server/main.lua'
client_script 'client/main.lua'

ui_page 'html/index.html'

files {
    'html/index.html',
    'html/style.css',
    'html/app.js'
}
