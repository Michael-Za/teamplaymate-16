
import os
import subprocess
import threading
import time
import requests

def start_service(command, working_dir, service_name):
    """Start a service in a specific directory"""
    print(f"Starting {service_name} service...")
    try:
        process = subprocess.Popen(
            command,
            cwd=working_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        return process
    except Exception as e:
        print(f"Error starting {service_name}: {e}")
        return None

def check_service(url, service_name, timeout=30):
    """Check if a service is running"""
    start_time = time.time()
    print(f"Checking {service_name} at {url}...")
    while time.time() - start_time < timeout:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"✓ {service_name} is running")
                return True
        except requests.exceptions.ConnectionError:
            time.sleep(2)
        except Exception as e:
            print(f"An error occurred while checking {service_name}: {e}")
            time.sleep(2)
    
    print(f"✗ {service_name} failed to start within {timeout} seconds")
    return False

def main():
    """Main function to start all services"""
    print("Starting StatSor Services...")
    print("=" * 50)
    
    # Service definitions
    services_to_start = [
        {"name": "Chatbot", "command": ["python", "app.py"], "dir": "backend/chatbot", "url": "http://localhost:5000/health"},
        {"name": "Backend", "command": ["npm", "start"], "dir": "backend", "url": "http://localhost:8080/health"}
    ]
    
    processes = []
    for service in services_to_start:
        process = start_service(service["command"], service["dir"], service["name"])
        if process:
            processes.append({"process": process, "name": service["name"]})
        else:
            for p_info in processes:
                p_info["process"].terminate()
            print(f"Failed to start {service['name']}. Aborting.")
            return

    print("\nWaiting for services to start...")
    print("-" * 30)
    
    all_ready = True
    for service in services_to_start:
        if not check_service(service["url"], service["name"]):
            all_ready = False
            break

    print("\n" + "=" * 50)
    if all_ready:
        print("🎉 All services are running successfully!")
        print("\nService URLs:")
        for service in services_to_start:
             print(f"  {service['name']}: {service['url'].replace('/health', '')}")
        print("\nPress Ctrl+C to stop services")
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n\nStopping services...")
            for p_info in processes:
                p_info["process"].terminate()
            print("Services stopped.")
    else:
        print("❌ Some services failed to start")
        print("Check the logs above for more information")
        for p_info in processes:
            p_info["process"].terminate()

if __name__ == "__main__":
    main()
