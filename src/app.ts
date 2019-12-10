import { Renderer } from './Renderer';


window.onload = () => {
    let renderer = new Renderer(window.innerWidth, window.innerHeight);
    document.body.appendChild( renderer.getCanvas() );

    window.addEventListener('resize', () => {renderer.resize(window.innerWidth, window.innerHeight)});

    renderer.start();
};
