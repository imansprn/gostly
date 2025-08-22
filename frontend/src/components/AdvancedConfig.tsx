import React, { useState, useEffect, useRef } from 'react';
import { ConfigurationTemplate } from '../types';

interface AdvancedConfigProps {
  currentConfig: string;
  onSaveConfig: (config: string) => Promise<boolean>;
  onResetConfig: () => void;
}

const AdvancedConfig: React.FC<AdvancedConfigProps> = ({ 
  currentConfig, 
  onSaveConfig, 
  onResetConfig 
}) => {
  const [configText, setConfigText] = useState(currentConfig);
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [lineNumbers, setLineNumbers] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Configuration templates
  const configTemplates: ConfigurationTemplate[] = [
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
          "username": "user",
          "password": "pass"
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
          "cert": "/path/to/cert.pem",
          "key": "/path/to/key.pem"
        }
      }
    }
  ]
}`
    }
  ];

  // Update line numbers when config changes
  useEffect(() => {
    const lines = configText.split('\n');
    const numbers = Array.from({ length: lines.length }, (_, i) => (i + 1).toString());
    setLineNumbers(numbers);
  }, [configText]);

  // Check for unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(configText !== currentConfig);
  }, [configText, currentConfig]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveEnabled && hasUnsavedChanges && configText.trim()) {
      const timer = setTimeout(() => {
        handleSaveConfig();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [configText, autoSaveEnabled, hasUnsavedChanges]);

  // Validate JSON configuration
  const validateConfig = (): string[] => {
    const errors: string[] = [];
    
    if (!configText.trim()) {
      errors.push('Configuration cannot be empty');
      return errors;
    }

    try {
      const parsed = JSON.parse(configText);
      
      // Basic structure validation
      if (!parsed.servers || !Array.isArray(parsed.servers)) {
        errors.push('Configuration must contain a "servers" array');
      }
      
      if (parsed.servers && parsed.servers.length === 0) {
        errors.push('At least one server configuration is required');
      }
      
      // Validate each server
      parsed.servers?.forEach((server: any, index: number) => {
        if (!server.addr) {
          errors.push(`Server ${index + 1}: Missing "addr" field`);
        }
        if (!server.handler) {
          errors.push(`Server ${index + 1}: Missing "handler" configuration`);
        }
        if (!server.listener) {
          errors.push(`Server ${index + 1}: Missing "listener" configuration`);
        }
      });
      
    } catch (error) {
      errors.push(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return errors;
  };

  // Handle configuration validation
  const handleValidateConfig = async () => {
    setIsValidating(true);
    const errors = validateConfig();
    setValidationErrors(errors);
    setIsValidating(false);
    
    if (errors.length === 0) {
      // Show success message
      setTimeout(() => setValidationErrors([]), 3000);
    }
  };

  // Handle saving configuration
  const handleSaveConfig = async () => {
    const errors = validateConfig();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      const success = await onSaveConfig(configText);
      if (success) {
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        setValidationErrors([]);
      }
    } catch (error) {
      setValidationErrors([`Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle template selection
  const handleTemplateSelect = (template: ConfigurationTemplate) => {
    setConfigText(template.config);
    setSelectedTemplate(template.name);
    setShowTemplates(false);
    setHasUnsavedChanges(true);
  };

  // Handle import configuration
  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setConfigText(content);
        setHasUnsavedChanges(true);
      };
      reader.readAsText(file);
    }
  };

  // Handle export configuration
  const handleExportConfig = () => {
    const blob = new Blob([configText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gostly-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle reset configuration
  const handleResetConfig = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('Are you sure you want to reset? All unsaved changes will be lost.')) {
        setConfigText(currentConfig);
        setHasUnsavedChanges(false);
        setValidationErrors([]);
        onResetConfig();
      }
    } else {
      onResetConfig();
    }
  };

  // Handle textarea changes
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setConfigText(e.target.value);
    setHasUnsavedChanges(e.target.value !== currentConfig);
  };

  // Handle key shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          handleSaveConfig();
          break;
        case 'z':
          e.preventDefault();
          // Could implement undo functionality
          break;
      }
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-slate-900">Advanced Configuration</h3>
          <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              hasUnsavedChanges ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
            }`}>
              {hasUnsavedChanges ? '⚠️ Unsaved Changes' : '✅ Saved'}
            </span>
            {lastSaved && (
              <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
            )}
            {autoSaveEnabled && (
              <span className="text-blue-600">🔄 Auto-save enabled</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Auto-save Toggle */}
          <button
            onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
            className={`px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
              autoSaveEnabled 
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {autoSaveEnabled ? '🔄 Auto-save ON' : '⏸️ Auto-save OFF'}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center space-x-2">
          {/* Templates */}
          <div className="relative">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="px-3 py-2 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md transition-colors duration-200"
            >
              📋 Templates
            </button>
            
            {showTemplates && (
              <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                <div className="p-3 border-b border-slate-200">
                  <h4 className="font-medium text-slate-900">Configuration Templates</h4>
                  <p className="text-sm text-slate-600">Choose a template to get started</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {configTemplates.map((template) => (
                    <button
                      key={template.name}
                      onClick={() => handleTemplateSelect(template)}
                      className="w-full p-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                    >
                      <div className="font-medium text-slate-900">{template.name}</div>
                      <div className="text-sm text-slate-600">{template.description}</div>
                      <div className="text-xs text-slate-500 mt-1">Type: {template.type}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Import/Export */}
          <div className="flex items-center space-x-2">
            <label className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors duration-200 cursor-pointer">
              📁 Import
              <input
                type="file"
                accept=".json,.txt"
                onChange={handleImportConfig}
                className="hidden"
              />
            </label>
            <button
              onClick={handleExportConfig}
              disabled={!configText.trim()}
              className="px-3 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors duration-200 disabled:opacity-50"
            >
              📤 Export
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Validate */}
          <button
            onClick={handleValidateConfig}
            disabled={isValidating || !configText.trim()}
            className="px-3 py-2 text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-md transition-colors duration-200 disabled:opacity-50"
          >
            {isValidating ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              '🔍 Validate'
            )}
          </button>

          {/* Reset */}
          <button
            onClick={handleResetConfig}
            className="px-3 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors duration-200"
          >
            🔄 Reset
          </button>

          {/* Save */}
          <button
            onClick={handleSaveConfig}
            disabled={isSaving || !hasUnsavedChanges}
            className="px-3 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors duration-200 disabled:opacity-50"
          >
            {isSaving ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              '💾 Save Changes'
            )}
          </button>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-red-600">❌</span>
            <span className="font-medium text-red-800">Configuration Validation Errors</span>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-sm text-red-700">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Configuration Editor */}
      <div className="relative">
        {/* Line Numbers */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-100 border-r border-slate-200 rounded-l-lg font-mono text-xs text-slate-500 overflow-hidden">
          {lineNumbers.map((num) => (
            <div key={num} className="px-2 py-0.5 text-right">
              {num}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={configText}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter your GOST configuration in JSON format..."
          className="w-full h-96 pl-14 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm text-slate-700 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          />
      </div>

      {/* Footer Info */}
      <div className="mt-4 text-xs text-slate-500 text-center">
        <span>💡 Use Ctrl+S (Cmd+S on Mac) to save • JSON format required • Validate before saving</span>
        {selectedTemplate && (
          <span className="ml-4 text-blue-600">📋 Using template: {selectedTemplate}</span>
        )}
      </div>

      {/* Help Section */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Configuration Help</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>servers</strong>: Array of proxy server configurations</p>
          <p>• <strong>addr</strong>: Server address and port (e.g., ":8080")</p>
          <p>• <strong>handler</strong>: Proxy protocol handler configuration</p>
          <p>• <strong>listener</strong>: Network listener configuration</p>
          <p>• Use templates to get started with common proxy types</p>
          <p>• Validate your configuration before saving to catch errors early</p>
        </div>
      </div>
    </div>
  );
};

export default AdvancedConfig;
