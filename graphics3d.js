if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var camera, controls, scene, renderer;

var asschdron_geometry;
var asschdron_colors;
var asschdron_lines;
var bkgd_dists;
var asschdron_points;
var active_point = null;
var active_triangulation = null;
var active_ring_sprite;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

var reset_view_fn;

function init_graphics3d(w,h,cvs) {

    camera = new THREE.PerspectiveCamera( 35, w / h, 0.001, 100000 );
    camera.position.z = 3.6;

    controls = new THREE.TrackballControls( camera, cvs );

    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;

    controls.noZoom = true;
    controls.noPan = true;

    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.1;

    controls.keys = [ 65, 83, 68 ];

    controls.addEventListener( 'change', render );

    reset_view_fn = function(){
        var old_damp = controls.dynamicDampingFactor;
        controls.dynamicDampingFactor=1;
        controls.update();
        controls.reset();
        controls.dynamicDampingFactor = old_damp;
    };

    // world

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2( 0xffffff, 0 );

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
            tri.userData = tri.userData || {};
            tri.userData.sourceColors = [asschdron_colors[a],asschdron_colors[b],asschdron_colors[c]];
            tri.vertexColors.push(asschdron_colors[a].clone());
            tri.vertexColors.push(asschdron_colors[b].clone());
            tri.vertexColors.push(asschdron_colors[c].clone());
            tri.color.setHSL(i/asschdron_faces.length, 1, 0.8);
            asschdron_geometry.faces.push(tri);
        }
    }

    for (var i = 0; i < asschdron_edges.length; i++) {
        var vert = asschdron_edges[i];
        asschdron_lines.vertices.push(asschdron_geometry.vertices[vert]);
    }
    asschdron_lines.computeLineDistances();

    //vertexColors: THREE.VertexColors,
    asschdron_material =  new THREE.MeshBasicMaterial( { side:THREE.DoubleSide, vertexColors: THREE.VertexColors,  shading: THREE.FlatShading } );

    var mesh = new THREE.Mesh( asschdron_geometry, asschdron_material );
    mesh.position.x = 0;
    mesh.position.y = 0;
    mesh.position.z = 0;
    mesh.updateMatrix();
    mesh.matrixAutoUpdate = false;
    scene.add( mesh );

    var line_material_back =  new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 0.5, depthTest: false});
    bkgd_dists = line_material_back;
    var linesegs = new THREE.LineSegments(asschdron_lines,line_material_back);
    scene.add(linesegs);

    var line_material_front =  new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 3, depthTest: true});
    var linesegs2 = new THREE.LineSegments(asschdron_lines,line_material_front);
    scene.add(linesegs2);
    
    var point_geometry = new THREE.SphereGeometry( 0.03, 32, 32 );
    var point_material = new THREE.MeshBasicMaterial( {color: 0x000000, depthTest: false} );

    asschdron_points=[];
    for (var i = 0; i < 14; i++) {
        var point = new THREE.Mesh( point_geometry, point_material.clone() );
        asschdron_points.push(point);
        scene.add(point);
    }

    var sprite_canvas = document.createElement('canvas');
    sprite_canvas.width = 128;
    sprite_canvas.height = 128;
    var sprite_ctx = sprite_canvas.getContext('2d');
    sprite_ctx.fillStyle = "transparent";
    sprite_ctx.strokeStyle = "white";
    sprite_ctx.lineWidth = 5;
    sprite_ctx.beginPath();
    sprite_ctx.arc(64,64,40,0,2*Math.PI);
    sprite_ctx.stroke();
    var ring_texture = new THREE.CanvasTexture(sprite_canvas);
    var ring_mat = new THREE.SpriteMaterial( { map: ring_texture, color:0xe3632d, depthTest:false} );
    active_ring_sprite = new THREE.Sprite( ring_mat );
    active_ring_sprite.position.set( Math.Infinity,0,0 );
    active_ring_sprite.scale.set(0.2,0.2,0.2);
    scene.add(active_ring_sprite);


    // renderer

    renderer = new THREE.WebGLRenderer( { antialias: false, canvas:cvs } );
    renderer.setClearColor( scene.fog.color );
    renderer.setPixelRatio( window.devicePixelRatio );
    // renderer.setSize( w, h );

    //

    render();

    //
    
    cvs.addEventListener("mousemove",function(e){
        var rel = cvs.getBoundingClientRect();
        var x = e.clientX - rel.left;
        var y = e.clientY - rel.top;
        mouse.x = (x/(rel.right-rel.left))*2-1;
        mouse.y = -((y/(rel.bottom-rel.top))*2-1);
        // console.log(x,y,w,h,mouse.x, mouse.y);
        render();
    });
}

function update_asschdron(points, extra_dim_color){
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
    if(extra_dim_color){
        for (var i = 0; i < asschdron_geometry.faces.length; i++) {
            var f = asschdron_geometry.faces[i];
            for (var j = 0; j < f.vertexColors.length; j++) {
                f.vertexColors[j].copy(f.userData.sourceColors[j]);
            }
        }
    }else{
        for (var i = 0; i < asschdron_geometry.faces.length; i++) {
            var f = asschdron_geometry.faces[i];
            for (var j = 0; j < f.vertexColors.length; j++) {
                f.vertexColors[j].copy(f.color);
            }
        }
    }
    asschdron_geometry.normalize();
    asschdron_geometry.verticesNeedUpdate = true;
    asschdron_geometry.colorsNeedUpdate = true;
    asschdron_lines.verticesNeedUpdate = true;
    asschdron_lines.lineDistancesNeedUpdate = true;
    asschdron_lines.computeLineDistances();
    bkgd_dists.needsUpdate = true;
    for (var i = 0; i < asschdron_points.length; i++) {
        asschdron_points[i].position.copy(asschdron_geometry.vertices[i]);
    }
    render();
}

function animate3d() {

    requestAnimationFrame( animate3d );
    controls.update();

}

function render() {

    raycaster.setFromCamera( mouse, camera );   
    var intersects = raycaster.intersectObjects( asschdron_points );
    if(intersects.length != 0 ){
        var min_dist = Infinity;
        var min_pt = null;
        for (var i = 0; i < intersects.length; i++) {
            if(intersects[i].distance < min_dist){
                min_dist = intersects[i].distance;
                min_pt = intersects[i].object;
            }
        }
        if(active_point != min_pt){
            if(active_point){
                active_point.material.color.set( 0x000000 );
            }
            active_point = min_pt;
            active_point.material.color.set( 0xe3632d );
            active_triangulation = asschdron_points.indexOf(min_pt);
            redraw();
        }
    }

    if(active_point){
        active_ring_sprite.position.copy(active_point.position);
    }

    renderer.render( scene, camera );

}