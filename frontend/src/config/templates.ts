import { ConfigurationTemplate } from '../types';

export const configTemplates: ConfigurationTemplate[] = [
  {
    name: 'HTTP Proxy',
    description: 'Basic HTTP proxy configuration',
    type: 'http',
    config: `{
  "servers": [
    {
      "addr": ":8080",
      "handler": {
        "type": "http"
      },
      "listener": {
        "type": "tcp"
      }
    }
  ]
}`
  },
  {
    name: 'SOCKS5 Proxy',
    description: 'SOCKS5 proxy with authentication',
    type: 'socks5',
    config: `{
  "servers": [
    {
      "addr": ":1080",
      "handler": {
        "type": "socks5",
        "auth": {
          "username": "your-username",
          "password": "your-password"
        }
      },
      "listener": {
        "type": "tcp"
      }
    }
  ]
}`
  },
  {
    name: 'Shadowsocks',
    description: 'Shadowsocks proxy configuration',
    type: 'shadowsocks',
    config: `{
  "servers": [
    {
      "addr": ":8388",
      "handler": {
        "type": "ss",
        "method": "aes-256-gcm",
        "password": "your-password"
      },
      "listener": {
        "type": "tcp"
      }
    }
  ]
}`
  },
  {
    name: 'VMess',
    description: 'VMess proxy configuration',
    type: 'vmess',
    config: `{
  "servers": [
    {
      "addr": ":10086",
      "handler": {
        "type": "vmess",
        "uuid": "your-uuid-here",
        "security": "auto"
      },
      "listener": {
        "type": "tcp"
      }
    }
  ]
}`
  },
  {
    name: 'Trojan',
    description: 'Trojan proxy configuration',
    type: 'trojan',
    config: `{
  "servers": [
    {
      "addr": ":443",
      "handler": {
        "type": "trojan",
        "password": "your-password"
      },
      "listener": {
        "type": "tcp",
        "tls": {
          "cert": "/path/to/your-cert.pem",
          "key": "/path/to/your-key.pem"
        }
      }
    }
  ]
}`
  }
];
