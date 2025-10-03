#!/bin/bash
# System Status Updater for Portfolio
# Sends battery level and location to portfolio API every 2 minutes

API_URL="https://omarelsawy.com/api/status"
UPDATE_INTERVAL=60  # 1 minute in seconds

get_battery_info() {
    local battery_path="/sys/class/power_supply/BAT0"
    [ ! -d "$battery_path" ] && battery_path="/sys/class/power_supply/BAT1"

    if [ -d "$battery_path" ]; then
        local capacity=$(cat "$battery_path/capacity" 2>/dev/null || echo "0")
        local status=$(cat "$battery_path/status" 2>/dev/null || echo "Unknown")
        local charging="false"
        [[ "$status" == "Charging" || "$status" == "Full" ]] && charging="true"
        echo "$capacity,$charging"
    else
        echo "0,false"
    fi
}

get_location() {
    local info=$(curl -s "https://ipinfo.io/json" 2>/dev/null)
    local city=$(echo "$info" | grep -o '"city": *"[^"]*"' | cut -d'"' -f4)
    local loc=$(echo "$info" | grep -o '"loc": *"[^"]*"' | cut -d'"' -f4)

    [ -z "$city" ] && city="Unknown"

    if [ -n "$loc" ]; then
        local lat=$(echo "$loc" | cut -d',' -f1)
        local lon=$(echo "$loc" | cut -d',' -f2)
        echo "$city,$lat,$lon"
    else
        echo "$city,,"
    fi
}

send_status() {
    local battery_info=$(get_battery_info)
    local battery=$(echo "$battery_info" | cut -d',' -f1)
    local charging=$(echo "$battery_info" | cut -d',' -f2)

    local location_info=$(get_location)
    local location=$(echo "$location_info" | cut -d',' -f1)
    local lat=$(echo "$location_info" | cut -d',' -f2)
    local lon=$(echo "$location_info" | cut -d',' -f3)

    local timestamp=$(date +%s)

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sending status update:"
    echo "  Battery: $battery%"
    echo "  Charging: $charging"
    echo "  Location: $location"
    echo "  Coordinates: $lat, $lon"
    echo "  Timestamp: $timestamp"

    local json_data="{\"battery\":$battery,\"charging\":$charging,\"location\":\"$location\",\"timestamp\":$timestamp"

    if [ -n "$lat" ] && [ -n "$lon" ]; then
        json_data="$json_data,\"latitude\":$lat,\"longitude\":$lon"
    fi

    json_data="$json_data}"

    local response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "$json_data")

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n-1)

    echo "  Response code: $http_code"
    echo "  Response body: $body"
    echo ""
}

while true; do
    send_status
    sleep "$UPDATE_INTERVAL"
done
