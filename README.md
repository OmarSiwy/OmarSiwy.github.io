# Portfolio Website

### (Heavily in Progress)

# For Local Hosting

## On desktop

```bash
cargo run
```

## On Browser

```bash
cargo install cargo-watch
cargo watch -x "run --target wasm32-unknown-unknown"
```

# How the Graphics Work:

- Surface
- Pipeline
- Buffers and Indices
- Textures and Bind Groups
- Uniform Buffers and 3D Camera
- Instancing

Surface: Created from Window

- Created, Resize, Input, Update, Render
  Inner Components:
  **Instance**, Creates Adapter and Surface
  **Adapter**: Handle for Graphics Card
  Used to create **Device** and **Queue**
  **Device**:
  **Queue**:

Event_Loop:: gets state of window/surface
