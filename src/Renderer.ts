import * as THREE from 'three';
import { GUI } from '../node_modules/three/examples/jsm/libs/dat.gui.module.js';

interface GuiParams
{
    xOffset: number,
    yOffset: number,
    rotation: number,
    scaleX: number,
    scaleY: number
}

export class Renderer
{
    constructor(width: number, height: number)
    {
        let canvas = document.createElement('canvas');
        let context = canvas.getContext('webgl2', {antialias: true});

        this.renderer_ = new THREE.WebGLRenderer({
            canvas: canvas,
            context: context as WebGL2RenderingContext
        });
        this.renderer_.setPixelRatio( window.devicePixelRatio );

        this.resize(width, height);

        this.scene_ = new THREE.Scene();
        this.camera_ = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        this.fullscreenQuad_ = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2));
        this.scene_.add(this.fullscreenQuad_);

        let renderTargetOptions: THREE.WebGLRenderTargetOptions = {
            format: THREE.RGBAFormat,
            magFilter: THREE.LinearFilter,
            minFilter: THREE.LinearFilter,
        }
        this.readBuffer_ = new THREE.WebGLMultisampleRenderTarget(this.renderer_.domElement.width, this.renderer_.domElement.height, renderTargetOptions);
        this.writeBuffer_ = new THREE.WebGLMultisampleRenderTarget(this.renderer_.domElement.width, this.renderer_.domElement.height, renderTargetOptions);

        this.params_ = {
            xOffset: 0.0,
            yOffset: 0.0,
            rotation: 0.0,
            scaleX: 0.5,
            scaleY: 0.5
        };

        let gui = new GUI();
        gui.add(this.params_, 'xOffset').name("X Offset").step(0.001);
        gui.add(this.params_, 'yOffset').name("Y Offset").step(0.001);
        gui.add(this.params_, 'rotation').name("Angle").step(0.001);
        gui.add(this.params_, 'scaleX').name("Scale X").step(0.001);
        gui.add(this.params_, 'scaleY').name("Scale Y").step(0.001);

        this.run = this.run.bind(this);
    }

    /** Start render loop */
    public start()
    {
        // Initialize
        this.fullscreenQuad_.material = new ColorShader(new THREE.Color(0x553333));
        this.renderer_.setRenderTarget(this.writeBuffer_);
        this.renderer_.render(this.scene_, this.camera_);
        this.swapBuffers();

        this.copyScreen();

        requestAnimationFrame(this.run);
    }

    /** Return the canvas created by the WebGLRenderer */
    public getCanvas(): HTMLCanvasElement
    {
        return this.renderer_.domElement;
    }

    /** Resize the renderer */
    public resize(width: number, height: number)
    {
        this.renderer_.setSize( width, height );
    }

    /** Render loop */
    private run(time: number)
    {
        this.fullscreenQuad_.material = new DisplayShader(this.readBuffer_.texture);
        this.renderer_.setRenderTarget(null);
        this.renderer_.render(this.scene_, this.camera_);

        this.transformScreen();
        this.mirrorScreen();
        this.copyScreen();
        // this.rotation_ = time * .0001;

        requestAnimationFrame( this.run );
    }

    private swapBuffers()
    {
        let tmp = this.readBuffer_;
        this.readBuffer_ = this.writeBuffer_;
        this.writeBuffer_ = tmp;
    }

    private copyScreen()
    {
        this.fullscreenQuad_.material = new InvertTextureShader(this.readBuffer_.texture);
        this.renderer_.setRenderTarget(this.writeBuffer_);
        this.renderer_.render(this.scene_, this.camera_);
        this.swapBuffers();
    }

    private transformScreen()
    {
        this.fullscreenQuad_.material = new TransformShader(
            this.readBuffer_.texture,
            // this.xOffset_, this.yOffset_, this.rotation_, this.scaleX_, this.scaleY_
            this.params_.xOffset, this.params_.yOffset, this.params_.rotation, this.params_.scaleX, this.params_.scaleY
        );
        this.renderer_.setRenderTarget(this.writeBuffer_);
        this.renderer_.render(this.scene_, this.camera_);
        this.swapBuffers();
    }

    private mirrorScreen()
    {
        this.fullscreenQuad_.material = new MirrorShader(this.readBuffer_.texture);
        this.renderer_.setRenderTarget(this.writeBuffer_);
        this.renderer_.render(this.scene_, this.camera_);
        this.swapBuffers();
    }

    private renderer_: THREE.WebGLRenderer;
    private scene_: THREE.Scene;
    private camera_: THREE.OrthographicCamera;
    private fullscreenQuad_: THREE.Mesh;
    private readBuffer_: THREE.WebGLMultisampleRenderTarget;
    private writeBuffer_: THREE.WebGLMultisampleRenderTarget;

    private params_: GuiParams;
}


class ColorShader extends THREE.ShaderMaterial
{
    constructor(color: THREE.Color)
    {
        super();
        this.uniforms = {color: {value: color.toArray()}};
        this.vertexShader = `
            void main() {
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
        `;
        this.fragmentShader= `
            uniform vec3 color;
            void main() {
                gl_FragColor = vec4(color, 1);
            }
        `;
    }
}

class InvertTextureShader extends THREE.ShaderMaterial
{
    constructor(texture: THREE.Texture)
    {
        super();
        this.uniforms = {inputTexture: {value: texture}};
        this.vertexShader = `
            varying vec2 vUV;
            void main() {
                vUV = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
        `;
        this.fragmentShader = `
            varying vec2 vUV;
            uniform sampler2D inputTexture;
            void main() {
                gl_FragColor = vec4(vec3(1) - texture2D(inputTexture, vUV).rgb, 1);
            }
        `;
    }
}

class MirrorShader extends THREE.ShaderMaterial
{
    constructor(texture: THREE.Texture)
    {
        super();
        this.uniforms = {inputTexture: {value: texture}};
        this.vertexShader = `
            varying vec2 vUV;
            void main() {
                vUV = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
        `;
        this.fragmentShader = `
            varying vec2 vUV;
            uniform sampler2D inputTexture;
            void main() {
                vec2 uv = vec2(vUV.x, vUV.y);
                if (vUV.x > 0.5) uv.x = 1.0 - vUV.x;
                // if (vUV.y > 0.5) uv.y = 1.0 - vUV.y;
                gl_FragColor = texture2D(inputTexture, uv);
            }
        `;
    }
}

class TransformShader extends THREE.ShaderMaterial
{
    constructor(texture: THREE.Texture, xOffset: number, yOffset: number, rotation: number, scaleX: number, scaleY: number)
    {
        super();
        this.uniforms = {
            inputTexture: {value: texture},
            translate: {value:[xOffset, yOffset]},
            rotate:{value:[Math.cos(rotation), Math.sin(rotation)]},
            scale:{value:[scaleX, scaleY]},
        };
        this.vertexShader = `
            varying highp vec2 vUV;
            uniform vec2 translate;
            uniform vec2 rotate;
            uniform vec2 scale;

            void main() {
                vUV = uv;
                highp vec3 p = (vec3(
                    position.x * rotate.x - position.y * rotate.y,
                    position.x * rotate.y + position.y * rotate.x,
                    position.z
                ) + vec3(translate, 0)) * vec3(scale, 1);
                gl_Position = projectionMatrix * modelViewMatrix * vec4( p, 1.0 );
            }
        `;
        this.fragmentShader = `
            varying highp vec2 vUV;
            uniform sampler2D inputTexture;

            void main() {
                highp vec4 result = texture2D(inputTexture, vUV);
                gl_FragColor = result;
            }
        `;
    }
}

class DisplayShader extends THREE.ShaderMaterial
{
    constructor(texture: THREE.Texture)
    {
        super();
        this.uniforms = {inputTexture: {value: texture}};
        this.vertexShader = `
            varying vec2 vUV;
            void main() {
                vUV = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
        `;
        this.fragmentShader = `
            varying vec2 vUV;
            uniform sampler2D inputTexture;
            void main() {
                gl_FragColor = texture2D(inputTexture, vUV);
            }
        `;
    }
}
