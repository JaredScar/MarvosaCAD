local apiUrl = GetConvar('marvosa_api_url', 'http://127.0.0.1:3000/api')
local apiKey = GetConvar('marvosa_api_key', 'marvosa-dev-key')

local sessions = {}

local departmentTypes = {
    LSPD = 'leo',
    BCSO = 'leo',
    SAHP = 'leo',
    LSFD = 'fire',
    EMS = 'ems',
}

local function encode(value)
    return (tostring(value or ''):gsub('[^%w%-_%.~]', function(char)
        return string.format('%%%02X', string.byte(char))
    end))
end

local function notify(target, message)
    TriggerClientEvent('marvosa:notify', target, message)
end

local function sessionFor(src)
    if not sessions[src] then
        sessions[src] = {
            callsign = ('UNIT-%s'):format(src),
            officerName = GetPlayerName(src) or ('Player ' .. src),
            department = Config.DefaultDepartment,
            type = Config.DefaultType,
            status = 'available',
        }
    end
    sessions[src].officerName = GetPlayerName(src) or sessions[src].officerName
    return sessions[src]
end

local function request(method, path, body, cb)
    PerformHttpRequest(apiUrl .. path, function(status, response)
        local data = nil
        if response and response ~= '' then
            local ok, parsed = pcall(json.decode, response)
            data = ok and parsed or nil
        end
        cb(status or 0, data)
    end, method, body and json.encode(body) or '', {
        ['Content-Type'] = 'application/json',
        ['x-api-key'] = apiKey,
    })
end

local function pushStatus(src, status, location)
    local session = sessionFor(src)
    if status then session.status = status end
    request('POST', '/integrations/units/status', {
        callsign = session.callsign,
        officerName = session.officerName,
        department = session.department,
        type = session.type,
        status = session.status,
        location = location,
        identifier = GetPlayerIdentifierByType(src, 'license'),
    }, function(code)
        if code < 200 or code >= 300 then
            notify(src, 'MarvosaCAD did not accept the status update.')
        end
    end)
end

RegisterNetEvent('marvosa:hello', function(payload)
    local src = source
    local session = sessionFor(src)
    if type(payload) == 'table' and type(payload.callsign) == 'string' and payload.callsign ~= '' then
        session.callsign = payload.callsign:upper()
    end
end)

RegisterNetEvent('marvosa:callsign', function(callsign)
    local src = source
    if type(callsign) ~= 'string' or callsign == '' then
        notify(src, 'Usage: /callsign 1A-12')
        return
    end
    local session = sessionFor(src)
    session.callsign = callsign:upper()
    notify(src, 'Call sign set to ' .. session.callsign)
    pushStatus(src, session.status)
end)

RegisterNetEvent('marvosa:department', function(department)
    local src = source
    local normalized = type(department) == 'string' and department:upper() or ''
    if not departmentTypes[normalized] then
        notify(src, 'Department must be LSPD, BCSO, SAHP, LSFD, or EMS.')
        return
    end
    local session = sessionFor(src)
    session.department = normalized
    session.type = departmentTypes[normalized]
    notify(src, 'Department set to ' .. normalized)
    pushStatus(src, session.status)
end)

RegisterNetEvent('marvosa:status', function(status, location)
    local allowed = { available = true, busy = true, enroute = true, onscene = true, offduty = true, panic = true }
    if not allowed[status] then
        notify(source, 'Status must be available, busy, enroute, onscene, offduty, or panic.')
        return
    end
    pushStatus(source, status, location)
    notify(source, 'Status is now ' .. status .. '.')
end)

RegisterNetEvent('marvosa:panic', function(location)
    local src = source
    local session = sessionFor(src)
    session.status = 'panic'
    request('POST', '/integrations/panic', {
        callsign = session.callsign,
        officerName = session.officerName,
        location = location,
        message = 'Panic button activated',
    }, function(code)
        if code >= 200 and code < 300 then
            notify(src, 'Panic sent to dispatch.')
        else
            notify(src, 'Panic did not reach MarvosaCAD.')
        end
    end)
end)

RegisterNetEvent('marvosa:911', function(payload)
    local src = source
    if type(payload) ~= 'table' or type(payload.message) ~= 'string' or payload.message == '' then
        notify(src, 'Usage: /911 what is happening')
        return
    end
    local session = sessionFor(src)
    request('POST', '/integrations/calls', {
        message = payload.message,
        caller = session.officerName,
        street = payload.street or 'Unknown location',
        callsign = session.callsign,
        officerName = session.officerName,
        department = session.department,
        x = payload.x,
        y = payload.y,
        z = payload.z,
    }, function(code, data)
        if code >= 200 and code < 300 and data and data.call then
            notify(src, ('Call #%s opened with dispatch.'):format(data.call.number))
        else
            notify(src, 'Dispatch did not receive that 911 call.')
        end
    end)
end)

RegisterNetEvent('marvosa:heartbeat', function(payload)
    local src = source
    if type(payload) ~= 'table' then return end
    local session = sessionFor(src)
    if session.status == 'offduty' then return end
    request('POST', '/integrations/units/heartbeat', {
        callsign = session.callsign,
        officerName = session.officerName,
        department = session.department,
        type = session.type,
        location = payload.street,
        identifier = GetPlayerIdentifierByType(src, 'license'),
    }, function() end)
end)

RegisterNetEvent('marvosa:mdt:open', function()
    local src = source
    local session = sessionFor(src)
    request('GET', '/integrations/snapshot?callsign=' .. encode(session.callsign), nil, function(code, data)
        if code >= 200 and code < 300 and data then
            data.session = session
            TriggerClientEvent('marvosa:mdt:data', src, data)
        else
            notify(src, 'The MDT could not reach MarvosaCAD.')
        end
    end)
end)

RegisterNetEvent('marvosa:plate', function(plate, fromMdt)
    local src = source
    if type(plate) ~= 'string' or plate == '' then
        notify(src, 'Usage: /plate 84KPL221')
        return
    end
    request('GET', '/integrations/plates/' .. encode(plate), nil, function(code, data)
        if not fromMdt then
            if code >= 200 and code < 300 and data and data.found and data.vehicle then
                local vehicle = data.vehicle
                local owner = vehicle.owner and (vehicle.owner.firstName .. ' ' .. vehicle.owner.lastName) or 'no owner'
                notify(src, ('%s %s %s — %s'):format(vehicle.plate, vehicle.color, vehicle.model, owner))
            else
                notify(src, 'No record for plate ' .. plate:upper())
            end
        end
        if fromMdt then
            TriggerClientEvent('marvosa:mdt:plate', src, data or { found = false, plate = plate })
        end
    end)
end)

RegisterNetEvent('marvosa:person', function(query)
    local src = source
    request('GET', '/integrations/people?q=' .. encode(query), nil, function(code, data)
        TriggerClientEvent('marvosa:mdt:people', src, (code >= 200 and code < 300 and data) or {})
    end)
end)

AddEventHandler('playerDropped', function()
    local src = source
    local session = sessions[src]
    if not session then return end
    request('POST', '/integrations/units/status', {
        callsign = session.callsign,
        officerName = session.officerName,
        department = session.department,
        type = session.type,
        status = 'offduty',
        location = 'Signed off',
    }, function() end)
    sessions[src] = nil
end)

AddEventHandler('onResourceStart', function(resource)
    if resource ~= GetCurrentResourceName() then return end
    print(('[marvosa-cad] API %s'):format(apiUrl))
end)
