# ComfyUI API Integration Guide

**Project**: comfyui-frontend-react  
**Date**: December 25, 2025  
**Version**: v1  
**Target**: Claude Code in VSCode

---

## Table of Contents

1. [Backend Setup](#1-backend-setup)
2. [API Overview](#2-api-overview)
3. [REST Endpoints](#3-rest-endpoints)
4. [WebSocket Communication](#4-websocket-communication)
5. [Workflow JSON Format](#5-workflow-json-format)
6. [Node Definitions](#6-node-definitions)
7. [Image Handling](#7-image-handling)
8. [Complete Client Implementation](#8-complete-client-implementation)
9. [Error Handling](#9-error-handling)
10. [Testing & Debugging](#10-testing--debugging)

---

## 1. Backend Setup

### 1.1 Install ComfyUI

```bash
# Clone repository
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Install PyTorch with CUDA (if you have NVIDIA GPU)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

### 1.2 Start the Server

```bash
# Basic start
python main.py

# With CORS enabled (required for React development)
python main.py --enable-cors-header

# With custom port
python main.py --port 8188

# Listen on all interfaces (for network access)
python main.py --listen 0.0.0.0

# Full development command
python main.py --enable-cors-header --listen 0.0.0.0 --port 8188
```

### 1.3 Verify Server is Running

```bash
# Check if server responds
curl http://localhost:8188/system_stats

# Expected response:
{
  "system": {
    "os": "posix",
    "python_version": "3.10.12",
    "embedded_python": false
  },
  "devices": [
    {
      "name": "cuda:0",
      "type": "cuda",
      "index": 0,
      "vram_total": 12884901888,
      "vram_free": 10737418240,
      "torch_vram_total": 12884901888,
      "torch_vram_free": 10737418240
    }
  ]
}
```

### 1.4 Directory Structure

```
ComfyUI/
├── models/
│   ├── checkpoints/      # SD models (.safetensors, .ckpt)
│   ├── clip/             # CLIP models
│   ├── controlnet/       # ControlNet models
│   ├── embeddings/       # Textual inversions
│   ├── loras/            # LoRA models
│   ├── upscale_models/   # Upscaler models
│   └── vae/              # VAE models
├── input/                # Uploaded input images
├── output/               # Generated output images
├── temp/                 # Preview images
└── custom_nodes/         # Custom node extensions
```

---

## 2. API Overview

### 2.1 Base URL

```
http://localhost:8188
```

### 2.2 Authentication

**None required for local development.**

For production deployments, you can add authentication via:
- Reverse proxy (nginx, Caddy) with basic auth
- Custom middleware
- Third-party API wrappers (ComfyICU, RunPod)

### 2.3 Endpoint Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/ws` | WebSocket | Real-time events |
| `/prompt` | POST | Queue workflow |
| `/queue` | GET | Queue status |
| `/queue` | POST | Manage queue |
| `/interrupt` | POST | Stop execution |
| `/history` | GET | All history |
| `/history/{prompt_id}` | GET | Specific result |
| `/history` | POST | Clear history |
| `/view` | GET | Get images |
| `/upload/image` | POST | Upload image |
| `/upload/mask` | POST | Upload mask |
| `/object_info` | GET | Node definitions |
| `/object_info/{node_type}` | GET | Single node info |
| `/embeddings` | GET | List embeddings |
| `/extensions` | GET | List extensions |
| `/system_stats` | GET | System info |
| `/free` | POST | Free VRAM |

---

## 3. REST Endpoints

### 3.1 Queue a Workflow

**POST /prompt**

Queue a workflow for execution.

```typescript
// Request
const response = await fetch('http://localhost:8188/prompt', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: workflowJson,        // The workflow in API format
    client_id: 'my-client-123',  // Optional: for WebSocket correlation
    extra_data: {                // Optional: additional metadata
      extra_pnginfo: {
        workflow: uiWorkflowJson // Optional: embed UI workflow in output
      }
    }
  })
})

// Success Response (200)
{
  "prompt_id": "abc123-def456-ghi789",
  "number": 1,  // Position in queue
  "node_errors": {}
}

// Error Response (400)
{
  "error": {
    "type": "prompt_no_outputs",
    "message": "Prompt has no outputs",
    "details": "",
    "extra_info": {}
  },
  "node_errors": {
    "3": {
      "type": "value_not_in_list",
      "message": "Value not in list",
      "details": "sampler_name: 'invalid' not in ['euler', 'euler_ancestral', ...]",
      "extra_info": {}
    }
  }
}
```

**curl example:**

```bash
curl -X POST http://localhost:8188/prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": {
      "3": {
        "class_type": "KSampler",
        "inputs": {
          "seed": 12345,
          "steps": 20,
          "cfg": 7,
          "sampler_name": "euler",
          "scheduler": "normal",
          "denoise": 1,
          "model": ["4", 0],
          "positive": ["6", 0],
          "negative": ["7", 0],
          "latent_image": ["5", 0]
        }
      }
    },
    "client_id": "test-client"
  }'
```

---

### 3.2 Get Queue Status

**GET /queue**

```typescript
const response = await fetch('http://localhost:8188/queue')
const data = await response.json()

// Response
{
  "queue_running": [
    [
      0,                           // Queue position
      "abc123-prompt-id",          // Prompt ID
      { /* workflow json */ },     // The workflow
      { "client_id": "my-client" } // Extra data
    ]
  ],
  "queue_pending": [
    [1, "def456-prompt-id", { /* workflow */ }, { }],
    [2, "ghi789-prompt-id", { /* workflow */ }, { }]
  ]
}
```

---

### 3.3 Manage Queue

**POST /queue**

Delete specific items or clear the queue.

```typescript
// Delete specific items
await fetch('http://localhost:8188/queue', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    delete: ['prompt-id-1', 'prompt-id-2']
  })
})

// Clear entire queue
await fetch('http://localhost:8188/queue', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clear: true
  })
})
```

---

### 3.4 Interrupt Execution

**POST /interrupt**

Stop the currently running workflow.

```typescript
await fetch('http://localhost:8188/interrupt', {
  method: 'POST'
})

// Response: 200 OK (empty body)
```

---

### 3.5 Get History

**GET /history**

Get all execution history.

```typescript
const response = await fetch('http://localhost:8188/history')
const history = await response.json()

// Response
{
  "abc123-prompt-id": {
    "prompt": [
      0,                    // Queue number
      "abc123-prompt-id",   // Prompt ID
      { /* workflow */ },   // Workflow JSON
      { },                  // Extra data
      ["output-node-ids"]   // Output node IDs
    ],
    "outputs": {
      "9": {  // Node ID
        "images": [
          {
            "filename": "ComfyUI_00001_.png",
            "subfolder": "",
            "type": "output"
          }
        ]
      }
    },
    "status": {
      "status_str": "success",
      "completed": true,
      "messages": [
        ["execution_start", { "prompt_id": "abc123" }],
        ["execution_cached", { "nodes": ["4", "5", "6"] }],
        ["executing", { "node": "3" }],
        ["executing", { "node": "9" }],
        ["execution_success", { "prompt_id": "abc123" }]
      ]
    }
  }
}
```

**GET /history/{prompt_id}**

Get specific execution result.

```typescript
const response = await fetch('http://localhost:8188/history/abc123-prompt-id')
const result = await response.json()

// Same structure as above, but only for the requested prompt_id
```

---

### 3.6 Clear History

**POST /history**

```typescript
// Clear specific items
await fetch('http://localhost:8188/history', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    delete: ['prompt-id-1', 'prompt-id-2']
  })
})

// Clear all history
await fetch('http://localhost:8188/history', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clear: true
  })
})
```

---

### 3.7 Get Node Definitions

**GET /object_info**

This is the **most important endpoint** for building the node library.

```typescript
const response = await fetch('http://localhost:8188/object_info')
const nodeDefinitions = await response.json()

// Response structure
{
  "KSampler": {
    "name": "KSampler",
    "display_name": "KSampler",
    "description": "",
    "category": "sampling",
    "output_node": false,
    "input": {
      "required": {
        "model": ["MODEL"],
        "seed": ["INT", {
          "default": 0,
          "min": 0,
          "max": 18446744073709551615
        }],
        "steps": ["INT", {
          "default": 20,
          "min": 1,
          "max": 10000
        }],
        "cfg": ["FLOAT", {
          "default": 8.0,
          "min": 0.0,
          "max": 100.0,
          "step": 0.1,
          "round": 0.01
        }],
        "sampler_name": [
          ["euler", "euler_ancestral", "heun", "heunpp2", "dpm_2", "dpm_2_ancestral", "lms", "dpm_fast", "dpm_adaptive", "dpmpp_2s_ancestral", "dpmpp_sde", "dpmpp_sde_gpu", "dpmpp_2m", "dpmpp_2m_sde", "dpmpp_2m_sde_gpu", "dpmpp_3m_sde", "dpmpp_3m_sde_gpu", "ddpm", "lcm", "ddim", "uni_pc", "uni_pc_bh2"]
        ],
        "scheduler": [
          ["normal", "karras", "exponential", "sgm_uniform", "simple", "ddim_uniform", "beta"]
        ],
        "positive": ["CONDITIONING"],
        "negative": ["CONDITIONING"],
        "latent_image": ["LATENT"]
      },
      "optional": {},
      "hidden": {
        "prompt": "PROMPT",
        "extra_pnginfo": "EXTRA_PNGINFO"
      }
    },
    "output": ["LATENT"],
    "output_is_list": [false],
    "output_name": ["LATENT"],
    "output_tooltips": [""]
  },
  "CheckpointLoaderSimple": {
    "name": "CheckpointLoaderSimple",
    "display_name": "Load Checkpoint",
    "category": "loaders",
    "input": {
      "required": {
        "ckpt_name": [
          ["v1-5-pruned-emaonly.safetensors", "sd_xl_base_1.0.safetensors"]
        ]
      }
    },
    "output": ["MODEL", "CLIP", "VAE"],
    "output_name": ["MODEL", "CLIP", "VAE"]
  },
  "CLIPTextEncode": {
    "name": "CLIPTextEncode",
    "display_name": "CLIP Text Encode (Prompt)",
    "category": "conditioning",
    "input": {
      "required": {
        "text": ["STRING", {
          "multiline": true,
          "dynamicPrompts": true
        }],
        "clip": ["CLIP"]
      }
    },
    "output": ["CONDITIONING"],
    "output_name": ["CONDITIONING"]
  },
  "SaveImage": {
    "name": "SaveImage",
    "display_name": "Save Image",
    "category": "image",
    "output_node": true,
    "input": {
      "required": {
        "images": ["IMAGE"],
        "filename_prefix": ["STRING", {
          "default": "ComfyUI"
        }]
      },
      "hidden": {
        "prompt": "PROMPT",
        "extra_pnginfo": "EXTRA_PNGINFO"
      }
    },
    "output": [],
    "output_name": []
  }
  // ... hundreds more nodes
}
```

**GET /object_info/{node_type}**

Get info for a single node type.

```typescript
const response = await fetch('http://localhost:8188/object_info/KSampler')
const ksampler = await response.json()
```

---

### 3.8 Get System Stats

**GET /system_stats**

```typescript
const response = await fetch('http://localhost:8188/system_stats')
const stats = await response.json()

// Response
{
  "system": {
    "os": "posix",
    "python_version": "3.10.12",
    "embedded_python": false
  },
  "devices": [
    {
      "name": "cuda:0",
      "type": "cuda",
      "index": 0,
      "vram_total": 12884901888,
      "vram_free": 10737418240,
      "torch_vram_total": 12884901888,
      "torch_vram_free": 10737418240
    }
  ]
}
```

---

### 3.9 Free VRAM

**POST /free**

Unload models and free GPU memory.

```typescript
await fetch('http://localhost:8188/free', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    unload_models: true,
    free_memory: true
  })
})
```

---

### 3.10 List Embeddings

**GET /embeddings**

```typescript
const response = await fetch('http://localhost:8188/embeddings')
const embeddings = await response.json()

// Response: Array of embedding names
["easynegative", "badhandv4", "ng_deepnegative_v1_75t"]
```

---

### 3.11 List Extensions

**GET /extensions**

```typescript
const response = await fetch('http://localhost:8188/extensions')
const extensions = await response.json()

// Response: Array of extension JS files to load
[
  "/extensions/core/colorPalette.js",
  "/extensions/core/contextMenuFilter.js",
  "/extensions/core/editAttention.js",
  "/extensions/ComfyUI-Manager/comfyui-manager.js"
]
```

---

## 4. WebSocket Communication

### 4.1 Establishing Connection

```typescript
// Generate unique client ID
const clientId = crypto.randomUUID()

// Connect to WebSocket
const ws = new WebSocket(`ws://localhost:8188/ws?clientId=${clientId}`)

ws.onopen = () => {
  console.log('Connected to ComfyUI')
}

ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  handleMessage(message)
}

ws.onerror = (error) => {
  console.error('WebSocket error:', error)
}

ws.onclose = () => {
  console.log('Disconnected from ComfyUI')
  // Implement reconnection logic
}
```

### 4.2 Message Types

```typescript
interface ComfyUIMessage {
  type: string
  data: unknown
}

function handleMessage(message: ComfyUIMessage) {
  switch (message.type) {
    case 'status':
      handleStatus(message.data)
      break
    case 'progress':
      handleProgress(message.data)
      break
    case 'executing':
      handleExecuting(message.data)
      break
    case 'executed':
      handleExecuted(message.data)
      break
    case 'execution_start':
      handleExecutionStart(message.data)
      break
    case 'execution_success':
      handleExecutionSuccess(message.data)
      break
    case 'execution_error':
      handleExecutionError(message.data)
      break
    case 'execution_cached':
      handleExecutionCached(message.data)
      break
    case 'execution_interrupted':
      handleInterrupted(message.data)
      break
  }
}
```

### 4.3 Message Details

**status**

Sent when queue status changes.

```typescript
{
  "type": "status",
  "data": {
    "status": {
      "exec_info": {
        "queue_remaining": 2
      }
    }
  }
}
```

**progress**

Sent during sampling/generation with progress updates.

```typescript
{
  "type": "progress",
  "data": {
    "value": 5,           // Current step
    "max": 20,            // Total steps
    "prompt_id": "abc123",
    "node": "3"           // Node ID being executed
  }
}
```

**executing**

Sent when a node starts or stops executing.

```typescript
// Node starting
{
  "type": "executing",
  "data": {
    "node": "3",           // Node ID
    "prompt_id": "abc123",
    "display_node": "3"    // For grouped nodes
  }
}

// Execution complete (node is null)
{
  "type": "executing",
  "data": {
    "node": null,
    "prompt_id": "abc123"
  }
}
```

**executed**

Sent when a node completes with output.

```typescript
{
  "type": "executed",
  "data": {
    "node": "9",
    "display_node": "9",
    "prompt_id": "abc123",
    "output": {
      "images": [
        {
          "filename": "ComfyUI_00001_.png",
          "subfolder": "",
          "type": "output"
        }
      ]
    }
  }
}
```

**execution_start**

Sent when a prompt starts executing.

```typescript
{
  "type": "execution_start",
  "data": {
    "prompt_id": "abc123"
  }
}
```

**execution_success**

Sent when a prompt completes successfully.

```typescript
{
  "type": "execution_success",
  "data": {
    "prompt_id": "abc123"
  }
}
```

**execution_error**

Sent when an error occurs.

```typescript
{
  "type": "execution_error",
  "data": {
    "prompt_id": "abc123",
    "node_id": "3",
    "node_type": "KSampler",
    "executed": ["4", "5", "6"],  // Nodes that completed
    "exception_message": "CUDA out of memory",
    "exception_type": "RuntimeError",
    "traceback": ["..."]
  }
}
```

**execution_cached**

Sent when nodes are skipped due to caching.

```typescript
{
  "type": "execution_cached",
  "data": {
    "nodes": ["4", "5", "6"],  // Cached node IDs
    "prompt_id": "abc123"
  }
}
```

**execution_interrupted**

Sent when execution is interrupted by user.

```typescript
{
  "type": "execution_interrupted",
  "data": {
    "prompt_id": "abc123"
  }
}
```

### 4.4 Binary Messages (Preview Images)

The WebSocket can also send binary data for preview images:

```typescript
ws.onmessage = (event) => {
  if (event.data instanceof Blob) {
    // Binary image data
    const imageUrl = URL.createObjectURL(event.data)
    displayPreview(imageUrl)
  } else {
    // JSON message
    const message = JSON.parse(event.data)
    handleMessage(message)
  }
}
```

---

## 5. Workflow JSON Format

### 5.1 API Format vs UI Format

ComfyUI has two workflow formats:

| Format | File | Purpose |
|--------|------|---------|
| **API Format** | workflow_api.json | Sent to /prompt endpoint |
| **UI Format** | workflow.json | Includes positions, colors, UI state |

The **API format** is what we need for execution.

### 5.2 API Format Structure

```json
{
  "node_id": {
    "class_type": "NodeTypeName",
    "inputs": {
      "widget_name": "value",
      "connection_input": ["source_node_id", output_slot_index]
    },
    "_meta": {
      "title": "Custom Node Title"
    }
  }
}
```

### 5.3 Complete Example Workflow

Text-to-image workflow:

```json
{
  "4": {
    "class_type": "CheckpointLoaderSimple",
    "inputs": {
      "ckpt_name": "v1-5-pruned-emaonly.safetensors"
    },
    "_meta": {
      "title": "Load Checkpoint"
    }
  },
  "5": {
    "class_type": "EmptyLatentImage",
    "inputs": {
      "width": 512,
      "height": 512,
      "batch_size": 1
    },
    "_meta": {
      "title": "Empty Latent Image"
    }
  },
  "6": {
    "class_type": "CLIPTextEncode",
    "inputs": {
      "text": "beautiful landscape, mountains, sunset, 8k, highly detailed",
      "clip": ["4", 1]
    },
    "_meta": {
      "title": "Positive Prompt"
    }
  },
  "7": {
    "class_type": "CLIPTextEncode",
    "inputs": {
      "text": "ugly, blurry, low quality",
      "clip": ["4", 1]
    },
    "_meta": {
      "title": "Negative Prompt"
    }
  },
  "3": {
    "class_type": "KSampler",
    "inputs": {
      "seed": 156680208700286,
      "steps": 20,
      "cfg": 7,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 1,
      "model": ["4", 0],
      "positive": ["6", 0],
      "negative": ["7", 0],
      "latent_image": ["5", 0]
    },
    "_meta": {
      "title": "KSampler"
    }
  },
  "8": {
    "class_type": "VAEDecode",
    "inputs": {
      "samples": ["3", 0],
      "vae": ["4", 2]
    },
    "_meta": {
      "title": "VAE Decode"
    }
  },
  "9": {
    "class_type": "SaveImage",
    "inputs": {
      "filename_prefix": "ComfyUI",
      "images": ["8", 0]
    },
    "_meta": {
      "title": "Save Image"
    }
  }
}
```

### 5.4 Connection Format

Connections are arrays: `["source_node_id", output_slot_index]`

```typescript
// Node 4 (CheckpointLoaderSimple) outputs:
// - Slot 0: MODEL
// - Slot 1: CLIP
// - Slot 2: VAE

// So to connect CLIP from node 4 to CLIPTextEncode:
{
  "6": {
    "class_type": "CLIPTextEncode",
    "inputs": {
      "text": "...",
      "clip": ["4", 1]  // Connect to node 4, slot 1 (CLIP)
    }
  }
}
```

### 5.5 Input Types

**Widget inputs** (direct values):

```json
{
  "seed": 12345,
  "steps": 20,
  "cfg": 7.5,
  "sampler_name": "euler",
  "text": "a photo of a cat",
  "width": 512
}
```

**Connection inputs** (from other nodes):

```json
{
  "model": ["4", 0],
  "positive": ["6", 0],
  "latent_image": ["5", 0]
}
```

---

## 6. Node Definitions

### 6.1 Parsing Node Definitions

```typescript
interface NodeDefinition {
  name: string
  display_name: string
  description: string
  category: string
  output_node: boolean
  input: {
    required?: Record<string, InputDefinition>
    optional?: Record<string, InputDefinition>
    hidden?: Record<string, string>
  }
  output: string[]
  output_is_list: boolean[]
  output_name: string[]
}

type InputDefinition =
  | [string]                        // Connection type: ["MODEL"]
  | [string[]]                      // Combo/select: [["euler", "dpm"]]
  | [string, InputConfig]           // Widget with config: ["INT", {...}]

interface InputConfig {
  default?: unknown
  min?: number
  max?: number
  step?: number
  round?: number
  multiline?: boolean
  dynamicPrompts?: boolean
  tooltip?: string
}
```

### 6.2 Determining Input Type

```typescript
function getInputType(input: InputDefinition): 'connection' | 'widget' {
  const [typeOrOptions, config] = input

  // If it's an array of strings, it's a combo/select widget
  if (Array.isArray(typeOrOptions)) {
    return 'widget'
  }

  // Check if it's a known connection type
  const connectionTypes = [
    'MODEL', 'CLIP', 'VAE', 'CONDITIONING', 'LATENT',
    'IMAGE', 'MASK', 'CONTROL_NET', 'CLIP_VISION',
    'STYLE_MODEL', 'GLIGEN', 'UPSCALE_MODEL'
  ]

  if (connectionTypes.includes(typeOrOptions)) {
    return 'connection'
  }

  // Widget types: INT, FLOAT, STRING, BOOLEAN
  return 'widget'
}
```

### 6.3 Creating Widgets from Definitions

```typescript
function createWidget(name: string, input: InputDefinition): Widget {
  const [typeOrOptions, config] = input

  // Combo/select
  if (Array.isArray(typeOrOptions)) {
    return {
      type: 'select',
      name,
      value: typeOrOptions[0],
      options: typeOrOptions
    }
  }

  switch (typeOrOptions) {
    case 'INT':
      return {
        type: 'number',
        name,
        value: config?.default ?? 0,
        min: config?.min ?? -Infinity,
        max: config?.max ?? Infinity,
        step: config?.step ?? 1
      }

    case 'FLOAT':
      return {
        type: 'slider',
        name,
        value: config?.default ?? 0,
        min: config?.min ?? 0,
        max: config?.max ?? 1,
        step: config?.step ?? 0.01
      }

    case 'STRING':
      return {
        type: config?.multiline ? 'textarea' : 'text',
        name,
        value: config?.default ?? ''
      }

    case 'BOOLEAN':
      return {
        type: 'checkbox',
        name,
        value: config?.default ?? false
      }

    default:
      return null
  }
}
```

---

## 7. Image Handling

### 7.1 View/Download Images

**GET /view**

```typescript
// Get generated image
const params = new URLSearchParams({
  filename: 'ComfyUI_00001_.png',
  subfolder: '',
  type: 'output'  // 'output', 'input', or 'temp'
})

const imageUrl = `http://localhost:8188/view?${params}`

// Or fetch as blob
const response = await fetch(imageUrl)
const blob = await response.blob()
const objectUrl = URL.createObjectURL(blob)
```

**Image types:**

| Type | Directory | Purpose |
|------|-----------|---------|
| `output` | /output/ | Saved images (SaveImage node) |
| `input` | /input/ | Uploaded input images |
| `temp` | /temp/ | Preview images (PreviewImage node) |

### 7.2 Upload Images

**POST /upload/image**

```typescript
async function uploadImage(
  file: File,
  subfolder: string = '',
  overwrite: boolean = false
): Promise<{ name: string; subfolder: string; type: string }> {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('type', 'input')
  formData.append('subfolder', subfolder)
  formData.append('overwrite', String(overwrite))

  const response = await fetch('http://localhost:8188/upload/image', {
    method: 'POST',
    body: formData
  })

  return response.json()
}

// Response
{
  "name": "uploaded_image.png",
  "subfolder": "",
  "type": "input"
}
```

### 7.3 Upload Masks

**POST /upload/mask**

```typescript
async function uploadMask(
  file: File,
  originalRef: { filename: string; subfolder: string; type: string }
): Promise<{ name: string; subfolder: string; type: string }> {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('type', 'input')
  formData.append('subfolder', 'masks')
  formData.append('original_ref', JSON.stringify(originalRef))

  const response = await fetch('http://localhost:8188/upload/mask', {
    method: 'POST',
    body: formData
  })

  return response.json()
}
```

### 7.4 Using Uploaded Images in Workflow

```json
{
  "10": {
    "class_type": "LoadImage",
    "inputs": {
      "image": "uploaded_image.png"
    }
  }
}
```

---

## 8. Complete Client Implementation

### 8.1 Full ComfyUI Client Class

```typescript
// src/lib/api/comfyClient.ts
// Date: December 25, 2025
// Version: v1

type MessageHandler = (data: unknown) => void

interface QueueResponse {
  prompt_id: string
  number: number
  node_errors: Record<string, unknown>
}

interface HistoryItem {
  prompt: unknown[]
  outputs: Record<string, { images?: ImageInfo[] }>
  status: {
    status_str: string
    completed: boolean
    messages: unknown[]
  }
}

interface ImageInfo {
  filename: string
  subfolder: string
  type: 'output' | 'input' | 'temp'
}

class ComfyUIClient {
  private baseUrl: string
  private wsUrl: string
  private clientId: string
  private ws: WebSocket | null = null
  private handlers: Map<string, Set<MessageHandler>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor(baseUrl: string = 'http://localhost:8188') {
    this.baseUrl = baseUrl
    this.wsUrl = baseUrl.replace('http', 'ws')
    this.clientId = this.generateClientId()
  }

  private generateClientId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  // ============================================
  // WebSocket Connection
  // ============================================

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    this.ws = new WebSocket(`${this.wsUrl}/ws?clientId=${this.clientId}`)

    this.ws.onopen = () => {
      console.log('[ComfyUI] WebSocket connected')
      this.reconnectAttempts = 0
      this.emit('connected', {})
    }

    this.ws.onmessage = (event) => {
      if (event.data instanceof Blob) {
        this.emit('preview', event.data)
        return
      }

      try {
        const message = JSON.parse(event.data)
        this.emit(message.type, message.data)
      } catch (error) {
        console.error('[ComfyUI] Failed to parse message:', error)
      }
    }

    this.ws.onerror = (error) => {
      console.error('[ComfyUI] WebSocket error:', error)
      this.emit('error', error)
    }

    this.ws.onclose = () => {
      console.log('[ComfyUI] WebSocket disconnected')
      this.emit('disconnected', {})
      this.attemptReconnect()
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[ComfyUI] Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    console.log(`[ComfyUI] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

    setTimeout(() => {
      this.connect()
    }, delay)
  }

  // ============================================
  // Event Handling
  // ============================================

  on(event: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)

    // Return unsubscribe function
    return () => {
      this.handlers.get(event)?.delete(handler)
    }
  }

  private emit(event: string, data: unknown): void {
    this.handlers.get(event)?.forEach((handler) => {
      try {
        handler(data)
      } catch (error) {
        console.error(`[ComfyUI] Error in ${event} handler:`, error)
      }
    })
  }

  // ============================================
  // REST API Methods
  // ============================================

  async getNodeDefinitions(): Promise<Record<string, unknown>> {
    const response = await fetch(`${this.baseUrl}/object_info`)
    if (!response.ok) {
      throw new Error(`Failed to get node definitions: ${response.statusText}`)
    }
    return response.json()
  }

  async getSystemStats(): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/system_stats`)
    return response.json()
  }

  async queuePrompt(workflow: unknown): Promise<QueueResponse> {
    const response = await fetch(`${this.baseUrl}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: workflow,
        client_id: this.clientId
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to queue prompt')
    }

    return response.json()
  }

  async getQueue(): Promise<{
    queue_running: unknown[]
    queue_pending: unknown[]
  }> {
    const response = await fetch(`${this.baseUrl}/queue`)
    return response.json()
  }

  async cancelQueue(promptIds?: string[]): Promise<void> {
    await fetch(`${this.baseUrl}/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promptIds ? { delete: promptIds } : { clear: true })
    })
  }

  async interrupt(): Promise<void> {
    await fetch(`${this.baseUrl}/interrupt`, {
      method: 'POST'
    })
  }

  async getHistory(promptId?: string): Promise<Record<string, HistoryItem>> {
    const url = promptId
      ? `${this.baseUrl}/history/${promptId}`
      : `${this.baseUrl}/history`
    const response = await fetch(url)
    return response.json()
  }

  async clearHistory(promptIds?: string[]): Promise<void> {
    await fetch(`${this.baseUrl}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promptIds ? { delete: promptIds } : { clear: true })
    })
  }

  async getEmbeddings(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/embeddings`)
    return response.json()
  }

  async freeMemory(): Promise<void> {
    await fetch(`${this.baseUrl}/free`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unload_models: true,
        free_memory: true
      })
    })
  }

  // ============================================
  // Image Methods
  // ============================================

  getImageUrl(filename: string, subfolder: string = '', type: 'output' | 'input' | 'temp' = 'output'): string {
    const params = new URLSearchParams({
      filename,
      subfolder,
      type
    })
    return `${this.baseUrl}/view?${params}`
  }

  async uploadImage(
    file: File,
    subfolder: string = '',
    overwrite: boolean = false
  ): Promise<ImageInfo> {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('type', 'input')
    formData.append('subfolder', subfolder)
    formData.append('overwrite', String(overwrite))

    const response = await fetch(`${this.baseUrl}/upload/image`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Failed to upload image: ${response.statusText}`)
    }

    return response.json()
  }

  async uploadMask(
    file: File,
    originalRef: ImageInfo
  ): Promise<ImageInfo> {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('type', 'input')
    formData.append('subfolder', 'masks')
    formData.append('original_ref', JSON.stringify(originalRef))

    const response = await fetch(`${this.baseUrl}/upload/mask`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Failed to upload mask: ${response.statusText}`)
    }

    return response.json()
  }

  // ============================================
  // Utility Methods
  // ============================================

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  get id(): string {
    return this.clientId
  }
}

// Export singleton instance
export const comfyAPI = new ComfyUIClient(
  process.env.NEXT_PUBLIC_COMFY_API_URL || 'http://localhost:8188'
)

// Export class for custom instances
export { ComfyUIClient }
```

---

## 9. Error Handling

### 9.1 Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `ECONNREFUSED` | ComfyUI not running | Start ComfyUI server |
| `CORS error` | Missing CORS header | Start with `--enable-cors-header` |
| `prompt_no_outputs` | Workflow has no output nodes | Add SaveImage node |
| `value_not_in_list` | Invalid combo value | Check /object_info for valid values |
| `CUDA out of memory` | Not enough VRAM | Reduce image size or batch |
| `Model not found` | Missing checkpoint | Download model to /models/checkpoints/ |

### 9.2 Error Response Format

```typescript
interface ErrorResponse {
  error: {
    type: string
    message: string
    details: string
    extra_info: Record<string, unknown>
  }
  node_errors: Record<string, NodeError>
}

interface NodeError {
  type: string
  message: string
  details: string
  extra_info: {
    input_name?: string
    input_config?: unknown
    received_value?: unknown
  }
}
```

### 9.3 Handling Errors

```typescript
async function queueWorkflowSafely(workflow: unknown) {
  try {
    const result = await comfyAPI.queuePrompt(workflow)

    if (Object.keys(result.node_errors).length > 0) {
      // Validation errors
      for (const [nodeId, error] of Object.entries(result.node_errors)) {
        console.error(`Node ${nodeId}: ${error.message}`)
      }
      throw new Error('Workflow validation failed')
    }

    return result.prompt_id
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to ComfyUI server')
    }
    throw error
  }
}
```

---

## 10. Testing & Debugging

### 10.1 curl Test Commands

```bash
# Test server is running
curl http://localhost:8188/system_stats | jq

# Get node definitions
curl http://localhost:8188/object_info | jq 'keys | length'
# Output: 200+ (number of available nodes)

# Get specific node info
curl http://localhost:8188/object_info/KSampler | jq

# Check queue
curl http://localhost:8188/queue | jq

# Queue a simple workflow
curl -X POST http://localhost:8188/prompt \
  -H "Content-Type: application/json" \
  -d @workflow_api.json

# Get history
curl http://localhost:8188/history | jq 'keys'

# Interrupt current execution
curl -X POST http://localhost:8188/interrupt

# Free VRAM
curl -X POST http://localhost:8188/free \
  -H "Content-Type: application/json" \
  -d '{"unload_models": true, "free_memory": true}'
```

### 10.2 WebSocket Testing with wscat

```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c "ws://localhost:8188/ws?clientId=test-123"

# You'll see messages when workflows execute
```

### 10.3 Debug Logging

Add to your client:

```typescript
// Enable verbose logging
comfyAPI.on('status', (data) => console.log('[status]', data))
comfyAPI.on('progress', (data) => console.log('[progress]', data))
comfyAPI.on('executing', (data) => console.log('[executing]', data))
comfyAPI.on('executed', (data) => console.log('[executed]', data))
comfyAPI.on('execution_error', (data) => console.error('[error]', data))
```

### 10.4 Browser DevTools

1. Open Network tab
2. Filter by "WS" for WebSocket messages
3. Filter by "Fetch/XHR" for REST calls
4. Check Console for errors

### 10.5 Common Issues

**Issue: CORS errors**

```
Access to fetch at 'http://localhost:8188/...' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Solution**: Start ComfyUI with `--enable-cors-header`

---

**Issue: WebSocket won't connect**

```
WebSocket connection to 'ws://localhost:8188/ws' failed
```

**Solution**: Check ComfyUI is running, check firewall settings

---

**Issue: Images return 404**

```
GET http://localhost:8188/view?filename=ComfyUI_00001_.png 404
```

**Solution**: Check `type` parameter (output/input/temp), verify file exists

---

## Summary

| What | How |
|------|-----|
| Get available nodes | `GET /object_info` |
| Queue workflow | `POST /prompt` with workflow JSON |
| Track progress | WebSocket `progress` messages |
| Get results | `GET /history/{prompt_id}` |
| Download images | `GET /view?filename=...&type=output` |
| Upload images | `POST /upload/image` with FormData |
| Stop execution | `POST /interrupt` |
| Clear queue | `POST /queue` with `{clear: true}` |

---

**Version**: v1  
**Last Updated**: December 25, 2025
