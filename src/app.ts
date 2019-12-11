import { Renderer } from './Renderer';
import { WEBGL } from '../node_modules/three/examples/jsm/WebGL';


window.onload = () => {
    if ( WEBGL.isWebGL2Available() === false ) {
        document.body.appendChild( WEBGL.getWebGL2ErrorMessage() );
    }
    else
    {
        let renderer = new Renderer(window.innerWidth, window.innerHeight);
        document.body.appendChild( renderer.getCanvas() );

        window.addEventListener('resize', () => {renderer.resize(window.innerWidth, window.innerHeight)});

        renderer.start();
    }
};
