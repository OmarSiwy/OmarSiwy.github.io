#!/bin/bash
# System Status Updater for Portfolio
# Sends battery, location, and Spotify status to portfolio API

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

get_spotify_info() {
    if playerctl -p spotify status &>/dev/null; then
        local status=$(playerctl -p spotify status 2>/dev/null)
        local track=$(playerctl -p spotify metadata title 2>/dev/null | sed 's/"/\\"/g')
        local artist=$(playerctl -p spotify metadata artist 2>/dev/null | sed 's/"/\\"/g')
        local album_art=$(playerctl -p spotify metadata mpris:artUrl 2>/dev/null)
        local position=$(playerctl -p spotify position 2>/dev/null)
        local length=$(playerctl -p spotify metadata mpris:length 2>/dev/null)

        local is_playing="false"
        [[ "$status" == "Playing" ]] && is_playing="true"

        # Convert position from seconds to milliseconds
        local position_ms=""
        if [ -n "$position" ]; then
            position_ms=$(echo "$position * 1000 / 1" | bc)
        fi

        # length is already in microseconds, convert to milliseconds
        local duration_ms=""
        if [ -n "$length" ]; then
            duration_ms=$(echo "$length / 1000" | bc)
        fi

        echo "$is_playing|$track|$artist|$album_art|$position_ms|$duration_ms"
    else
        echo ""
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

    local spotify_info=$(get_spotify_info)
    local is_playing=""
    local track=""
    local artist=""
    local album_art=""
    local position_ms=""
    local duration_ms=""

    if [ -n "$spotify_info" ]; then
        is_playing=$(echo "$spotify_info" | cut -d'|' -f1)
        track=$(echo "$spotify_info" | cut -d'|' -f2)
        artist=$(echo "$spotify_info" | cut -d'|' -f3)
        album_art=$(echo "$spotify_info" | cut -d'|' -f4)
        position_ms=$(echo "$spotify_info" | cut -d'|' -f5)
        duration_ms=$(echo "$spotify_info" | cut -d'|' -f6)
    fi

    local timestamp=$(date +%s)

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sending status update:"
    echo "  Battery: $battery%"
    echo "  Charging: $charging"
    echo "  Location: $location"
    echo "  Coordinates: $lat, $lon"
    echo "  Spotify: $track - $artist (Playing: $is_playing)"
    echo "  Timestamp: $timestamp"

    # Build JSON with proper escaping
    local json_data="{\"battery\":$battery,\"charging\":$charging,\"location\":\"$location\",\"timestamp\":$timestamp"

    if [ -n "$lat" ] && [ -n "$lon" ]; then
        json_data="$json_data,\"latitude\":$lat,\"longitude\":$lon"
    fi

    # Add Spotify data if available
    if [ -n "$track" ]; then
        json_data="$json_data,\"spotify\":{\"is_playing\":$is_playing,\"track_name\":\"$track\",\"artist_name\":\"$artist\""

        if [ -n "$album_art" ]; then
            json_data="$json_data,\"album_art\":\"$album_art\""
        fi

        if [ -n "$position_ms" ]; then
            json_data="$json_data,\"position_ms\":$position_ms"
        fi

        if [ -n "$duration_ms" ]; then
            json_data="$json_data,\"duration_ms\":$duration_ms"
        fi

        json_data="$json_data}"
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

# Monitor for song changes in background
monitor_song_changes() {
    local last_track=""
    playerctl -p spotify -F metadata title 2>/dev/null | while read -r current_track; do
        if [ -n "$current_track" ] && [ "$current_track" != "$last_track" ]; then
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] Song changed: $current_track"
            send_status
            last_track="$current_track"
        fi
    done
}

# Start song change monitor in background
if command -v playerctl &> /dev/null; then
    monitor_song_changes &
fi

# Regular status updates
while true; do
    send_status
    sleep "$UPDATE_INTERVAL"
done
