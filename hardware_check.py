import time
import json
import random
import sys

def get_metrics():
    # Mocking hardware metrics for the HUD
    # In a real environment, we would use psutil and specific NPU drivers
    cpu_load = random.uniform(20.0, 65.0)
    ram_usage = random.uniform(3.2, 12.8) # in GB
    
    # QNN Execution Provider (NPU) specific mock
    npu_load = random.uniform(10.0, 95.0)
    npu_temp = random.uniform(45.0, 78.0)
    
    return {
        "timestamp": time.time(),
        "cpu": round(cpu_load, 1),
        "ram": round(ram_usage, 2),
        "npu": round(npu_load, 1),
        "npu_temp": round(npu_temp, 1),
        "status": "optimal" if npu_load < 85 else "warning"
    }

if __name__ == "__main__":
    try:
        while True:
            metrics = get_metrics()
            print(json.dumps(metrics))
            sys.stdout.flush()
            time.sleep(1)
    except KeyboardInterrupt:
        pass
