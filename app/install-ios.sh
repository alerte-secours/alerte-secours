#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_error() {
    echo -e "${RED}Error: $1${NC}" >&2
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}Warning: $1${NC}"
}

print_info() {
    echo -e "${BLUE}$1${NC}"
}

print_plain() {
    echo -e "$1"
}

# Check if Xcode command line tools are available
if ! command -v xcrun &> /dev/null; then
    print_error "Xcode command line tools are not installed."
    print_info "Please install them by running: xcode-select --install"
    exit 1
fi

# Define IPA path
IPA_PATH="ios/build/AlerteSecours.ipa"

# Check if IPA file exists
if [ ! -f "$IPA_PATH" ]; then
    print_error "IPA file not found at: $IPA_PATH"
    print_info "Please build the iOS bundle first by running:"
    print_info "  yarn bundle:ios"
    exit 1
fi

print_info "Found IPA file: $IPA_PATH"

# Function to get connected physical iOS devices
get_physical_devices() {
    xcrun devicectl list devices 2>/dev/null | awk 'NR>2 && $4=="available" {print $3}' || true
}

# Function to get available simulators (booted ones)
get_booted_simulators() {
    xcrun simctl list devices | grep -E "\(Booted\)" | sed -E 's/.*\(([A-F0-9-]{36})\) \(Booted\)/\1/' || true
}

# Function to get simulator name by UDID
get_simulator_name() {
    local udid="$1"
    xcrun simctl list devices | grep "$udid" | sed -E 's/^[[:space:]]*([^(]+).*/\1/' | xargs
}

# Function to get device name by UDID (for physical devices)
get_device_name() {
    local udid="$1"
    xcrun devicectl list devices 2>/dev/null | awk -v target_udid="$udid" 'NR>2 && $3==target_udid {print $1}' || echo "Unknown Device"
}

# Function to validate physical device UDID
validate_physical_device() {
    local device_id="$1"
    local devices=$(get_physical_devices)
    
    if [ -z "$devices" ]; then
        return 1
    fi
    
    echo "$devices" | grep -q "^$device_id$"
}

# Function to validate simulator UDID
validate_simulator() {
    local simulator_id="$1"
    local simulators=$(get_booted_simulators)
    
    if [ -z "$simulators" ]; then
        return 1
    fi
    
    echo "$simulators" | grep -q "^$simulator_id$"
}

# Function to install on physical device
install_on_device() {
    local device_id="$1"
    local device_name=$(get_device_name "$device_id")
    
    print_info "Installing on physical device: $device_name ($device_id)"
    
    if xcrun devicectl device install app --device "$device_id" "$IPA_PATH"; then
        print_success "Installation completed successfully on $device_name!"
        return 0
    else
        print_error "Installation failed on $device_name"
        print_info "Common solutions:"
        print_info "  1. Make sure the device is unlocked and trusted"
        print_info "  2. Check that the provisioning profile matches the device"
        print_info "  3. Verify the device has enough storage space"
        print_info "  4. Try disconnecting and reconnecting the device"
        return 1
    fi
}

# Function to install on simulator
install_on_simulator() {
    local simulator_id="$1"
    local simulator_name=$(get_simulator_name "$simulator_id")
    
    print_info "Installing on simulator: $simulator_name ($simulator_id)"
    
    if xcrun simctl install "$simulator_id" "$IPA_PATH"; then
        print_success "Installation completed successfully on $simulator_name!"
        return 0
    else
        print_error "Installation failed on $simulator_name"
        print_info "Make sure the simulator is booted and try again"
        return 1
    fi
}

# Main installation logic
if [ -n "$IOS_DEVICE" ]; then
    # Specific physical device requested
    print_info "Using specified physical device: $IOS_DEVICE"
    
    if ! validate_physical_device "$IOS_DEVICE"; then
        print_error "Physical device $IOS_DEVICE is not connected or not found."
        print_info "Connected physical devices:"
        physical_devices=$(get_physical_devices)
        if [ -n "$physical_devices" ]; then
            echo "$physical_devices" | while read -r device; do
                device_name=$(get_device_name "$device")
                print_info "  - $device ($device_name)"
            done
        else
            print_info "  No physical devices found"
        fi
        exit 1
    fi
    
    install_on_device "$IOS_DEVICE"
    
elif [ -n "$IOS_SIMULATOR" ]; then
    # Specific simulator requested
    print_info "Using specified simulator: $IOS_SIMULATOR"
    
    if ! validate_simulator "$IOS_SIMULATOR"; then
        print_error "Simulator $IOS_SIMULATOR is not booted or not found."
        print_info "Booted simulators:"
        booted_simulators=$(get_booted_simulators)
        if [ -n "$booted_simulators" ]; then
            echo "$booted_simulators" | while read -r sim; do
                sim_name=$(get_simulator_name "$sim")
                print_info "  - $sim ($sim_name)"
            done
        else
            print_info "  No booted simulators found"
            print_info "  Start a simulator from Xcode or run: xcrun simctl boot <simulator-udid>"
        fi
        exit 1
    fi
    
    install_on_simulator "$IOS_SIMULATOR"
    
else
    # Auto-detect: prefer physical devices, fallback to simulators
    print_info "Auto-detecting iOS targets..."
    
    # Try physical devices first
    physical_devices=$(get_physical_devices)
    if [ -n "$physical_devices" ]; then
        target_device=$(echo "$physical_devices" | head -n 1)
        device_count=$(echo "$physical_devices" | wc -l | tr -d ' ')
        
        if [ "$device_count" -gt 1 ]; then
            print_warning "Multiple physical devices found. Using first device: $target_device"
            print_info "Available physical devices:"
            echo "$physical_devices" | while read -r device; do
                device_name=$(get_device_name "$device")
                if [ "$device" = "$target_device" ]; then
                    print_info "  - $device ($device_name) [selected]"
                else
                    print_info "  - $device ($device_name)"
                fi
            done
            print_info "To use a specific device, run: IOS_DEVICE=<device-udid> yarn install:ios"
        else
            device_name=$(get_device_name "$target_device")
            print_info "Using physical device: $device_name ($target_device)"
        fi
        
        install_on_device "$target_device"
    else
        # No physical devices, try simulators
        print_info "No physical devices found. Looking for booted simulators..."
        
        booted_simulators=$(get_booted_simulators)
        if [ -n "$booted_simulators" ]; then
            target_simulator=$(echo "$booted_simulators" | head -n 1)
            simulator_count=$(echo "$booted_simulators" | wc -l | tr -d ' ')
            
            if [ "$simulator_count" -gt 1 ]; then
                print_warning "Multiple booted simulators found. Using first simulator: $target_simulator"
                print_info "Available booted simulators:"
                echo "$booted_simulators" | while read -r sim; do
                    sim_name=$(get_simulator_name "$sim")
                    if [ "$sim" = "$target_simulator" ]; then
                        print_info "  - $sim ($sim_name) [selected]"
                    else
                        print_info "  - $sim ($sim_name)"
                    fi
                done
                print_info "To use a specific simulator, run: IOS_SIMULATOR=<simulator-udid> yarn install:ios"
            else
                simulator_name=$(get_simulator_name "$target_simulator")
                print_info "Using simulator: $simulator_name ($target_simulator)"
            fi
            
            install_on_simulator "$target_simulator"
        else
            print_error "No iOS devices or booted simulators found."
            print_info "Please either:"
            print_info "  1. Connect and trust an iOS device, or"
            print_info "  2. Boot a simulator from Xcode"
            print_info ""
            print_info "Usage examples:"
            print_info "  Auto-detect: yarn install:ios"
            print_info "  Specific device: IOS_DEVICE=<device-udid> yarn install:ios"
            print_info "  Specific simulator: IOS_SIMULATOR=<simulator-udid> yarn install:ios"
            exit 1
        fi
    fi
fi
