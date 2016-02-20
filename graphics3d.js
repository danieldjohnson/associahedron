if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var camera, controls, scene, renderer;

var asschdron_geometry;
var asschdron_colors;
var asschdron_lines;
var bkgd_dists;

var asschdron_faces = [
    [5, 8, 11, 3, 13],
    [1, 7, 10, 5, 13],
    [13, 3, 6, 9, 1],
    [3, 11, 0, 6],
    [0, 11, 8, 2, 12],
    [1, 9, 4, 7],
    [0, 12, 4, 9, 6],
    [10, 7, 4, 12, 2],
    [8, 5, 10, 2],
];

var used = {}
var asschdron_edges = [];
for (var i = 0; i < asschdron_faces.length; i++) {
    var face = asschdron_faces[i];
    for (var j = 0; j < face.length; j++) {
        var first = face[j];
        var second = face[(j+1)%face.length];
        var key = Math.min(first,second) + 14*Math.max(first,second);
        if(!used[key]){
            used[key] = true;
            asschdron_edges.push(first, second);
        }
    }
}

function init_graphics3d(w,h,cvs) {

    camera = new THREE.PerspectiveCamera( 60, w / h, 0.001, 100000 );
    camera.position.z = 3;

    controls = new THREE.TrackballControls( camera, cvs );

    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;

    controls.noZoom = false;
    controls.noPan = true;

    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.1;

    controls.keys = [ 65, 83, 68 ];

    controls.addEventListener( 'change', render );

    // world

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( 0xffffff, 0*0.002 );

    asschdron_geometry = new THREE.Geometry();
    asschdron_lines = new THREE.Geometry();
    asschdron_colors = [];

    for (var i = 0; i < 14; i++) {
        var vec = new THREE.Vector3(0,0,0);
        asschdron_geometry.vertices.push(vec);
        asschdron_colors.push(new THREE.Color(0xFFFFFF*i/13));
    }

    for (var i = 0; i < asschdron_faces.length; i++) {
        var face = asschdron_faces[i];
        var a = face[0];
        for (var j = 1; j <= face.length-2; j++) {
            var c = face[j];
            var b = face[j+1];
            var tri = new THREE.Face3(a,b,c);
            tri.vertexColors.push(asschdron_colors[a]);
            tri.vertexColors.push(asschdron_colors[b]);
            tri.vertexColors.push(asschdron_colors[c]);
            asschdron_geometry.faces.push(tri);
        }
    }

    for (var i = 0; i < asschdron_edges.length; i++) {
        var vert = asschdron_edges[i];
        asschdron_lines.vertices.push(asschdron_geometry.vertices[vert]);
    }
    asschdron_lines.computeLineDistances();

    //vertexColors: THREE.VertexColors,
    var face_material =  new THREE.MeshBasicMaterial( { wireframe:false, vertexColors: THREE.VertexColors,  shading: THREE.FlatShading } );

    var mesh = new THREE.Mesh( asschdron_geometry, face_material );
    mesh.position.x = 0;
    mesh.position.y = 0;
    mesh.position.z = 0;
    mesh.updateMatrix();
    mesh.matrixAutoUpdate = false;
    scene.add( mesh );

    var line_material_back =  new THREE.LineDashedMaterial( { color: 0x000000, dashSize:.05, gapSize:.05, linewidth: 1, depthTest: false});
    bkgd_dists = line_material_back;
    var linesegs = new THREE.LineSegments(asschdron_lines,line_material_back);
    scene.add(linesegs);

    var line_material_front =  new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 2, depthTest: true});
    var linesegs2 = new THREE.LineSegments(asschdron_lines,line_material_front);
    scene.add(linesegs2);
    // lights

    light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 1, 1, 1 );
    scene.add( light );

    light = new THREE.DirectionalLight( 0x333333 );
    light.position.set( -1, -1, -1 );
    scene.add( light );

    light = new THREE.AmbientLight( 0x222222 );
    scene.add( light );


    // renderer

    renderer = new THREE.WebGLRenderer( { antialias: false, canvas:cvs } );
    renderer.setClearColor( scene.fog.color );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( w, h );

    //

    render();

}

function update_asschdron(points){
    var min_coord=Infinity, max_coord=-Infinity;
    for (var i = 0; i < points.length; i++) {
        var pt = points[i];
        min_coord = Math.min(min_coord, pt[3], pt[4], pt[5]);
        max_coord = Math.max(max_coord, pt[3], pt[4], pt[5]);
    }
    for (var i = 0; i < points.length; i++) {
        var pt = points[i];
        asschdron_geometry.vertices[i].set(pt[0],pt[1],pt[2]);
        asschdron_colors[i].setRGB( (pt[3]-min_coord)/(max_coord-min_coord),
                                    (pt[4]-min_coord)/(max_coord-min_coord),
                                    (pt[5]-min_coord)/(max_coord-min_coord));
    }
    asschdron_geometry.normalize();
    asschdron_geometry.verticesNeedUpdate = true;
    asschdron_geometry.colorsNeedUpdate = true;
    asschdron_lines.verticesNeedUpdate = true;
    asschdron_lines.lineDistancesNeedUpdate = true;
    asschdron_lines.computeLineDistances();
    bkgd_dists.needsUpdate = true;
    render();
}

function animate3d() {

    requestAnimationFrame( animate3d );
    controls.update();

}

function render() {

    renderer.render( scene, camera );

}