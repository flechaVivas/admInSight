import { Component, OnInit } from '@angular/core';
import { SshService } from '../../../services/ssh.service';
import { Router } from '@angular/router';
import { Chart } from 'chart.js';

export interface DiskInfo {
  device: string;
  model: string;
  totalSize: string;
  usedSize: string;
  availableSize: string;
  usedPercentage: string;
  partitions: DiskPartition[];
  showPartitions: boolean;
}

export interface DiskPartition {
  name: string;
  mountPoint: string;
  fileSystem: string;
  size: string;
  label: string;
  usedPercentage: number;
  mounted: boolean;
}

@Component({
  selector: 'app-storage',
  templateUrl: './storage.component.html',
})
export class StorageComponent implements OnInit {
  disks: DiskInfo[] = [];

  constructor(private sshService: SshService, private router: Router) { }

  private systemId: number = Number(this.router.url.split('/')[2]);

  showPasswordModal: boolean = false;
  currentMountPoint: string = '';
  currentLabel: string = '';
  currentAction: 'mount' | 'unmount' = 'mount';

  ngOnInit() {
    if (this.systemId) {
      this.fetchDiskInfo();
    } else {
      console.error('No se ha proporcionado el ID del sistema');
    }
  }

  fetchDiskInfo() {
    const diskCommand = `lsblk -d -o NAME,MODEL,SIZE,TYPE | grep disk | while IFS= read -r line; do
    dev=$(echo "$line" | awk '{print $1}')
    total_size=$(echo "$line" | awk '{print $NF}')
    model=$(echo "$line" | awk '{$1=""; $NF=""; print $0}' | sed 's/^ //; s/ $//')
    used_size=$(df -B1 --output=source,used | grep "^/dev/$dev" | awk '{sum += $2} END {printf "%.2f GiB\\n", sum / (1024 * 1024 * 1024)}')
    available_size=$(df -B1 --output=source,avail | grep "^/dev/$dev" | awk '{sum += $2} END {printf "%.2f GiB\\n", sum / (1024 * 1024 * 1024)}')
    used_percentage=$(df -B1 --output=source,size,used | grep "^/dev/$dev" | awk '{size+=$2; used+=$3} END {if (size > 0) printf "%.2f%%\\n", (used/size)*100; else print "N/A"}')
    echo "Device: /dev/$dev, Model: $model, Total Size: $total_size, Used Size: $used_size, Available Size: $available_size, USED %: $used_percentage"
  done`;

    this.sshService.executeCommand(this.systemId, [diskCommand])
      .subscribe(
        (response: any) => {
          const diskOutput = response[diskCommand]?.stdout || '';
          const diskLines = diskOutput.trim().split('\n');

          this.disks = [];

          for (const line of diskLines) {
            if (line.includes('Device:')) {
              const [device, model, totalSize, usedSize, availableSize, usedPercentage] = line.split(', ');
              const currentDisk: DiskInfo = {
                device: device.replace('Device: ', ''),
                model: model.replace('Model: ', ''),
                totalSize: totalSize.replace('Total Size: ', ''),
                usedSize: usedSize.replace('Used Size: ', ''),
                availableSize: availableSize.replace('Available Size: ', ''),
                usedPercentage: usedPercentage.replace('USED %: ', ''),
                partitions: [],
                showPartitions: false
              };
              this.disks.push(currentDisk);
              this.fetchPartitions(currentDisk.device, currentDisk);
            }
          }
        },
        (error) => {
          this.handleError(error);
        }
      );
  }

  fetchPartitions(device: string, disk: DiskInfo) {
    const partitionCommand = `lsblk -nr -o NAME,FSTYPE,MOUNTPOINT,LABEL ${device}`;

    this.sshService.executeCommand(this.systemId, [partitionCommand])
      .subscribe(
        (response: any) => {
          const partitionOutput = response[partitionCommand]?.stdout || '';
          const partitionLines = partitionOutput.trim().split('\n').slice(1);

          for (const line of partitionLines) {
            if (line.trim() !== '') {
              const [name, fileSystem, mountPoint, label] = line.trim().split(' ');
              const partition: DiskPartition = {
                name,
                mountPoint: mountPoint || '',
                fileSystem: fileSystem || '',
                size: '',
                label: label || '',
                usedPercentage: 0,
                mounted: true
              };
              disk.partitions.push(partition);
            }
          }
        },
        (error) => {
          this.handleError(error);
        }
      );
  }

  fetchPartitionSizes(device: string) {
    const command = `lsblk -nr -o NAME,SIZE ${device}`;

    this.sshService.executeCommand(this.systemId, [command])
      .subscribe(
        (response: any) => {
          const output = response[command]?.stdout || '';
          const lines = output.trim().split('\n');

          const partitionSizes: { [key: string]: number } = {};

          for (const line of lines.slice(1)) {
            if (line.trim() !== '') {
              const [name, size] = line.trim().split(' ');
              const numericSize = this.parseSize(size);
              partitionSizes[name] = numericSize;
            }
          }

          this.renderPartitionSizeChart(device, partitionSizes);
        },
        (error) => {
          this.handleError(error);
        }
      );
  }

  parseSize(sizeString: string): number {
    const match = sizeString.match(/(\d+(?:,\d+)?)\s*(\w*)/);
    if (match) {
      const value = parseFloat(match[1].replace(',', '.'));
      const unit = match[2].toUpperCase();
      switch (unit) {
        case 'B':
          return value;
        case 'K':
          return value * 1024;
        case 'M':
          return value * 1024 ** 2;
        case 'G':
          return value * 1024 ** 3;
        case 'T':
          return value * 1024 ** 4;
        default:
          return 0;
      }
    }
    return 0;
  }


  togglePartitions(disk: DiskInfo) {
    disk.showPartitions = !disk.showPartitions;
    if (disk.showPartitions) {
      this.fetchPartitionUsage(disk);
      this.fetchPartitionSizes(disk.device);
    } else {
      this.destroyPartitionSizeChart(disk.device);
    }
  }

  fetchPartitionUsage(disk: DiskInfo) {
    const partitionUsageCommands = disk.partitions.map((partition) => `df --output=source,used --block-size=1 ${partition.mountPoint} | tail -n 1 | awk '{print $2}'`);

    this.sshService.executeCommand(this.systemId, partitionUsageCommands)
      .subscribe(
        (response: any) => {
          disk.partitions.forEach((partition, index) => {
            const output = response[`df --output=source,used --block-size=1 ${partition.mountPoint} | tail -n 1 | awk '{print $2}'`]?.stdout || '';
            const usedBytes = parseInt(output.trim(), 10);
            const totalBytes = parseInt(partition.size.split(' ')[0], 10);
            const usedPercentage = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;
            partition.usedPercentage = usedPercentage;
          });
          console.log(disk.partitions);
        },
        (error) => {
          this.handleError(error);
        }
      );
  }

  renderPartitionSizeChart(device: string, partitionSizes: { [key: string]: number }) {
    const canvas = document.getElementById(`partitionSizeChart-${device}`) as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const chart = Chart.getChart(canvas);

      if (!chart) {
        new Chart(ctx, {
          type: 'pie',
          data: {
            labels: Object.keys(partitionSizes),
            datasets: [
              {
                data: Object.values(partitionSizes),
                backgroundColor: [
                  '#FF6384',
                  '#36A2EB',
                  '#FFCE56',
                  '#4BC0C0',
                  '#9966FF',
                  '#FF9F40',
                  '#8FBC8F',
                  '#E9967A',
                  '#8A2BE2',
                  '#00FA9A',
                ],
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: `Partition Sizes (${device})`,
              },
            },
          },
        });
      } else {
        chart.data.labels = Object.keys(partitionSizes);
        chart.data.datasets[0].data = Object.values(partitionSizes);
        chart.update();
      }
    } else {
      console.error('Failed to get canvas context');
    }
  }

  destroyPartitionSizeChart(device: string) {
    const canvas = document.getElementById(`partitionSizeChart-${device}`) as HTMLCanvasElement;
    const chart = Chart.getChart(canvas);
    if (chart) {
      chart.destroy();
    }
  }

  unmountPartition(mountPoint: string) {
    this.showPasswordModal = true;
    this.currentMountPoint = mountPoint;
    this.currentAction = 'unmount';
  }

  mountPartition(label: string) {
    console.log('Mounting partition:', label);
    this.showPasswordModal = true;
    this.currentLabel = label;
    this.currentAction = 'mount';
  }

  onPasswordConfirm(sudoPassword: string) {
    const command = this.currentAction === 'mount' ? `echo '${sudoPassword}' | sudo -S mount -L ${this.currentLabel}` : `echo '${sudoPassword}' | sudo -S umount ${this.currentMountPoint}`;
    this.executeCommand([command]);
    this.showPasswordModal = false;
    this.currentMountPoint = '';
  }

  onPasswordCancel() {
    this.showPasswordModal = false;
    this.currentMountPoint = '';
  }

  executeCommand(commands: string[], callback?: () => void) {
    this.sshService.executeCommand(this.systemId, commands)
      .subscribe(
        (response) => {
          console.log(response);
          if (callback) {
            callback();
          }
          this.fetchDiskInfo();
        },
        (error) => {
          console.error('Error al ejecutar los comandos:', error);
        }
      );
  }


  handleError(error: any): void {
    if (error.error.error_code === 'invalid_ssh_token') {
      alert('El token SSH ha expirado. Por favor, vuelva a iniciar sesión.');
      this.router.navigateByUrl('/login-server');
    }
  }

}