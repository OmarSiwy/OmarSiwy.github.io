# AutoSimulate

### (Heavily in Progress)

## Plan:

Create a GUI with the capability of taking an AutoCAD/SolidWorks Model (.dwg), allowing the user to assign charge (Constant, or Time-Varying), Voltage (AC, DC, orr Time-Varying), Resistance (Constant, or Time-Varying), to Simulate Electric Fields and Force Effects on components using the **Finite Element Method**.

### Learning Curve:

- Monday-Wednesday, June 3rd - June 5th, Attend Finite Element Method Lectures, Develop intuituion behind it and apply it to connect charge and voltage with Electric Fields, Magnetic Fields, and Forces.

### Steps:

1. Create a GUI using WGPU, with the center being a model renderer
   a. Check that it works with Web and Application
2. Create a Model Renderer for .dwg files
   a. Render the Model
   b. Modify the Model using the software
   c. Save the modified Model
3. Write the Physics Engine behind it using the Finite Element Method
   a. Simulate the passing of charge/voltage in an area
   b. Create the physics and draw the Electric Field Produced
   c. Create the physics and draw the Magnetic Field Produced
   d. Create the physics and calculate the Force Produced from Magnetic Field
   e. Add the Force of Gravity optionally into calculations
4. Create a simulator with takes the .dwg into a model form not modifying it at all
   a. Simulates the Force acting on each object with varying rates per second for client-side optimization if pc is slow
   b. Allow user to "quick-start" simulation by moving a piece using their mouse (some simulations are evenly balanced in the beginning and need an initial momentum to start)

### Goals:

I really like physics simulations and I'd love to create one to learn more about rust, graphics, and FEM.

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
