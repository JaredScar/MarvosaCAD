local mdtOpen = false

local function streetAt(coords)
    local streetHash, crossHash = GetStreetNameAtCoord(coords.x, coords.y, coords.z)
    local street = GetStreetNameFromHashKey(streetHash)
    local cross = GetStreetNameFromHashKey(crossHash)
    local zone = GetLabelText(GetNameOfZone(coords.x, coords.y, coords.z))
    local line = (street and street ~= '') and street or 'Unknown'
    if cross and cross ~= '' then
        line = line .. ' / ' .. cross
    end
    if zone and zone ~= '' and zone ~= 'NULL' then
        line = line .. ', ' .. zone
    end
    return line
end

local function here()
    local coords = GetEntityCoords(PlayerPedId())
    return coords, streetAt(coords)
end

local function openMdt()
    TriggerServerEvent('marvosa:mdt:open')
end

RegisterNetEvent('marvosa:notify', function(message)
    BeginTextCommandThefeedPost('STRING')
    AddTextComponentSubstringPlayerName(message)
    EndTextCommandThefeedPostTicker(false, false)
    TriggerEvent('chat:addMessage', {
        color = { 232, 135, 42 },
        args = { 'MarvosaCAD', message },
    })
end)

RegisterNetEvent('marvosa:mdt:data', function(data)
    mdtOpen = true
    SetNuiFocus(true, true)
    SendNUIMessage({ action = 'open', payload = data })
end)

RegisterNetEvent('marvosa:mdt:plate', function(data)
    SendNUIMessage({ action = 'plate', payload = data })
end)

RegisterNetEvent('marvosa:mdt:people', function(data)
    SendNUIMessage({ action = 'people', payload = data })
end)

RegisterCommand('911', function(_, args)
    local message = table.concat(args, ' ')
    local coords, street = here()
    TriggerServerEvent('marvosa:911', {
        message = message,
        street = street,
        x = coords.x,
        y = coords.y,
        z = coords.z,
    })
end, false)

RegisterCommand('callsign', function(_, args)
    local callsign = args[1]
    if callsign then
        SetResourceKvp('marvosa_callsign', callsign:upper())
    end
    TriggerServerEvent('marvosa:callsign', callsign)
end, false)

RegisterCommand('department', function(_, args)
    TriggerServerEvent('marvosa:department', args[1])
end, false)

RegisterCommand('status', function(_, args)
    local _, street = here()
    TriggerServerEvent('marvosa:status', args[1], street)
end, false)

RegisterCommand('panic', function()
    local _, street = here()
    TriggerServerEvent('marvosa:panic', street)
end, false)

RegisterCommand('plate', function(_, args)
    TriggerServerEvent('marvosa:plate', args[1], false)
end, false)

RegisterCommand('mdt', function()
    if mdtOpen then
        mdtOpen = false
        SetNuiFocus(false, false)
        SendNUIMessage({ action = 'close' })
        return
    end
    openMdt()
end, false)

RegisterKeyMapping('mdt', 'Open the MarvosaCAD MDT', 'keyboard', 'F6')

RegisterNUICallback('close', function(_, cb)
    mdtOpen = false
    SetNuiFocus(false, false)
    cb({ ok = true })
end)

RegisterNUICallback('refresh', function(_, cb)
    openMdt()
    cb({ ok = true })
end)

RegisterNUICallback('status', function(body, cb)
    local _, street = here()
    TriggerServerEvent('marvosa:status', body.status, street)
    cb({ ok = true })
end)

RegisterNUICallback('panic', function(_, cb)
    local _, street = here()
    TriggerServerEvent('marvosa:panic', street)
    cb({ ok = true })
end)

RegisterNUICallback('plate', function(body, cb)
    TriggerServerEvent('marvosa:plate', body.plate, true)
    cb({ ok = true })
end)

RegisterNUICallback('person', function(body, cb)
    TriggerServerEvent('marvosa:person', body.query)
    cb({ ok = true })
end)

RegisterNUICallback('waypoint', function(body, cb)
    if body.x and body.y then
        SetNewWaypoint(body.x + 0.0, body.y + 0.0)
    end
    cb({ ok = true })
end)

CreateThread(function()
    local saved = GetResourceKvpString('marvosa_callsign')
    TriggerServerEvent('marvosa:hello', { callsign = saved or '' })
    TriggerEvent('chat:addSuggestion', '/911', 'Send a call to MarvosaCAD', { { name = 'message', help = 'What is happening' } })
    TriggerEvent('chat:addSuggestion', '/callsign', 'Set your CAD call sign', { { name = 'id', help = 'Example: 1A-12' } })
    TriggerEvent('chat:addSuggestion', '/department', 'Set your department', { { name = 'name', help = 'LSPD, BCSO, SAHP, LSFD, EMS' } })
    TriggerEvent('chat:addSuggestion', '/status', 'Update your unit status', { { name = 'status', help = 'available, busy, enroute, onscene, offduty' } })
    TriggerEvent('chat:addSuggestion', '/panic', 'Send a panic alert to dispatch')
    TriggerEvent('chat:addSuggestion', '/plate', 'Look up a plate', { { name = 'plate', help = 'License plate' } })
    TriggerEvent('chat:addSuggestion', '/mdt', 'Open the mobile data terminal')

    while true do
        Wait((Config.HeartbeatSeconds or 20) * 1000)
        local coords, street = here()
        TriggerServerEvent('marvosa:heartbeat', { street = street, x = coords.x, y = coords.y, z = coords.z })
    end
end)
