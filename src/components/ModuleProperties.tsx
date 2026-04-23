import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { AgentModule, PropertySchema } from '../types';

interface ModulePropertiesProps {
  module: AgentModule;
  allModules: AgentModule[];
  onUpdate: (config: Record<string, any>) => void;
  onUpdateDependencies: (deps: string[]) => void;
  onValidationChange?: (errors: string[]) => void;
  onAction?: (actionId: string, config: Record<string, any>) => void;
}

export function ModuleProperties({ module, allModules, onUpdate, onUpdateDependencies, onValidationChange, onAction }: ModulePropertiesProps) {
  const [activeView, setActiveView] = useState<'params' | 'schema'>('params');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (schema: PropertySchema, value: any) => {
    let error = '';
    
    if (schema.required && (value === undefined || value === null || (typeof value === 'string' && value.trim() === ''))) {
      error = `${schema.label} is required`;
    } else if (schema.type === 'number') {
      const num = Number(value);
      if (value !== '' && value !== undefined && isNaN(num)) {
        error = `Invalid input: ${schema.label} must be a numeric value`;
      } else if (schema.min !== undefined && num < schema.min) {
        error = `Value exceeds threshold: minimum allowed is ${schema.min}`;
      } else if (schema.max !== undefined && num > schema.max) {
        error = `Value exceeds threshold: maximum allowed is ${schema.max}`;
      }
    } else if (schema.type === 'string' || schema.type === 'textarea') {
       if (value !== undefined && typeof value !== 'string') {
         error = `Invalid data type: expected string for ${schema.label}`;
       }
    }
    
    const newErrors = { ...errors, [schema.id]: error };
    setErrors(newErrors);
    
    if (onValidationChange) {
      const errorList = Object.values(newErrors).filter(e => e !== '') as string[];
      onValidationChange(errorList);
    }
    
    return !error;
  };

  const handleChange = (schema: PropertySchema, value: any) => {
    validate(schema, value);
    onUpdate({
      ...module.config,
      [schema.id]: value
    });
  };

  const handleToggleDependency = (depId: string) => {
    const currentDeps = module.dependencies || [];
    const newDeps = currentDeps.includes(depId)
      ? currentDeps.filter(id => id !== depId)
      : [...currentDeps, depId];
    onUpdateDependencies(newDeps);
  };

  const possibleDependencies = allModules.filter(m => m.id !== module.id);

  const renderField = (schema: PropertySchema) => {
    const value = module.config[schema.id];
    const hasError = !!errors[schema.id];

    switch (schema.type) {
      case 'select':
        return (
          <div className="space-y-1">
            <Select 
              value={String(value || '')} 
              onValueChange={(val) => handleChange(schema, val)}
            >
              <SelectTrigger className={cn("bg-zinc-950 border-zinc-800 h-9", hasError && "border-rose-500 ring-rose-500/20")}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                {schema.options?.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError && <p className="text-[10px] text-rose-500 italic px-1">{errors[schema.id]}</p>}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex items-center justify-between bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50 transition-colors hover:bg-zinc-950">
            <span className="text-xs text-zinc-400 font-medium">{schema.label}</span>
            <Switch 
              checked={!!value} 
              onCheckedChange={(val) => handleChange(schema, val)} 
              className="data-[state=checked]:bg-orange-500"
            />
          </div>
        );

      case 'number':
        if (schema.min !== undefined && schema.max !== undefined && schema.max - schema.min <= 10) {
           return (
            <div className="space-y-3 pt-1">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] text-zinc-500 font-mono">{value ?? schema.min}</span>
                <span className="text-[10px] text-zinc-500 font-mono">{schema.max}</span>
              </div>
              <Slider 
                value={[typeof value === 'number' ? value : (schema.min || 0)]} 
                min={schema.min} 
                max={schema.max} 
                step={schema.max - schema.min <= 1 ? 0.01 : 1} 
                onValueChange={([val]) => handleChange(schema, val)}
                className="hover:cursor-pointer"
              />
            </div>
          );
        }
        return (
          <div className="space-y-1">
            <Input 
              type="number"
              value={value ?? ''} 
              placeholder={schema.placeholder}
              onChange={(e) => handleChange(schema, Number(e.target.value))}
              className={cn("bg-zinc-950 border-zinc-800 h-9 focus:ring-orange-500/20", hasError && "border-rose-500 ring-rose-500/20")} 
            />
            {hasError && <p className="text-[10px] text-rose-500 italic px-1">{errors[schema.id]}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-1">
            <textarea
              value={value || ''}
              placeholder={schema.placeholder}
              onChange={(e) => handleChange(schema, e.target.value)}
              className={cn(
                "w-full min-h-[80px] rounded-md bg-zinc-950 border border-zinc-800 p-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all resize-none",
                hasError && "border-rose-500 ring-rose-500/20"
              )}
            />
            {hasError && <p className="text-[10px] text-rose-500 italic px-1">{errors[schema.id]}</p>}
          </div>
        );

      case 'button':
        return (
          <Button 
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold h-10 shadow-lg shadow-orange-500/10"
            onClick={() => onAction?.(schema.id, module.config)}
          >
            {schema.label}
          </Button>
        );

      default:
        return (
          <div className="space-y-1">
            <Input 
              value={value || ''} 
              placeholder={schema.placeholder}
              onChange={(e) => handleChange(schema, e.target.value)}
              className={cn("bg-zinc-950 border-zinc-800 h-9 focus:ring-orange-500/20", hasError && "border-rose-500 ring-rose-500/20")} 
            />
            {hasError && <p className="text-[10px] text-rose-500 italic px-1">{errors[schema.id]}</p>}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
        <button 
          onClick={() => setActiveView('params')}
          className={cn(
            "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
            activeView === 'params' ? "bg-zinc-800 text-orange-500 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          Parameters
        </button>
        <button 
          onClick={() => setActiveView('schema')}
          className={cn(
            "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
            activeView === 'schema' ? "bg-zinc-800 text-orange-500 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          Node Schema
        </button>
      </div>

      {activeView === 'params' ? (
        <div className="space-y-8">
          <div className="space-y-5">
            {module.schema ? (
              module.schema.map((field) => (
                <div key={field.id} className="space-y-2.5">
                  <div className="flex justify-between items-end">
                    <Label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                      {field.label}
                      {field.required && <span className="text-orange-500 ml-1 italic opacity-70">*</span>}
                    </Label>
                    {field.description && (
                      <span className="text-[9px] text-zinc-600 italic max-w-[60%] text-right leading-tight">{field.description}</span>
                    )}
                  </div>
                  {renderField(field)}
                </div>
              ))
            ) : (
              <p className="text-[10px] text-zinc-500 italic py-4 border border-dashed border-zinc-800 rounded-lg text-center">
                No specific parameters defined for this module.
              </p>
            )}
          </div>

          <Separator className="bg-zinc-800/50" />
          
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-2">
                Dependencies
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-zinc-800 bg-zinc-950 text-orange-500 font-mono">
                  {(module.dependencies || []).length}
                </Badge>
              </Label>
              <span className="text-[9px] text-zinc-600 italic">Upstream data sources</span>
            </div>
            
            <ScrollArea className="h-[250px] pr-4">
              <div className="space-y-2 pb-2">
                {possibleDependencies.map(m => (
                  <div 
                    key={m.id} 
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer group hover:scale-[1.01]",
                      (module.dependencies || []).includes(m.id) 
                        ? "bg-orange-500/5 border-orange-500/20 text-orange-400" 
                        : "bg-zinc-950/30 border-zinc-800 text-zinc-500 hover:border-zinc-700/50 hover:bg-zinc-900/50"
                    )}
                    onClick={() => handleToggleDependency(m.id)}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Switch 
                        checked={(module.dependencies || []).includes(m.id)} 
                        onCheckedChange={() => handleToggleDependency(m.id)}
                        className="scale-75 data-[state=checked]:bg-orange-500"
                      />
                      <span className="text-[11px] font-semibold truncate leading-none">{m.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[8px] border-zinc-800 uppercase tracking-tighter opacity-40 group-hover:opacity-100">{m.type}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
           <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">
             <div className="space-y-1">
               <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Node Identity</p>
               <p className="text-xs font-mono text-zinc-300">MOD_{module.id.split('-')[0].toUpperCase()}</p>
             </div>
             <div className="space-y-1">
               <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Primitive Class</p>
               <Badge variant="outline" className="text-[10px] bg-zinc-900 border-zinc-800 text-orange-400">{module.type}</Badge>
             </div>
             <Separator className="bg-zinc-800" />
             <div className="space-y-3">
               <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Injected Schema Fields</p>
               {module.schema?.map(field => (
                 <div key={field.id} className="p-2 bg-zinc-900 rounded border border-zinc-800/50 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-zinc-200">{field.id}</span>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">{field.type}</span>
                    </div>
                    {field.description && <p className="text-[10px] text-zinc-500 italic mt-1">{field.description}</p>}
                    {field.min !== undefined && <p className="text-[9px] text-zinc-600">Min: {field.min}</p>}
                    {field.max !== undefined && <p className="text-[9px] text-zinc-600">Max: {field.max}</p>}
                 </div>
               ))}
             </div>
           </div>
           <div className="p-3 bg-orange-500/5 border border-orange-500/10 rounded-lg">
             <p className="text-[10px] text-orange-500/70 italic leading-relaxed">
               Neural schemas define the immutable contract for this node. Changes to values in the Parameters tab are validated against these constraints in real-time.
             </p>
           </div>
        </div>
      )}
    </div>
  );
}
