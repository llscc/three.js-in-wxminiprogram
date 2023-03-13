import { registerGLTFLoader } from '../loaders/gltf-loader'
import registerOrbit from "./orbit"

export function renderModel(canvas, THREE) {
  registerGLTFLoader(THREE)

  var container, stats, clock, gui, mixer, actions, activeAction, previousAction;
  var camera, scene, renderer, model, face, controls;
  var api = { state: 'Walking' };
  init();
  animate();
  function init() {
    //相机
    camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 0.25, 100);
    camera.position.set(- 5, 3, 10);
    camera.lookAt(new THREE.Vector3(0, 2, 0));
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe0e0e0);//背景色
    scene.fog = new THREE.Fog(0xe0e0e0, 20, 100); //雾效果，场景内距离摄像机20个单位的对象会有雾效果，距离100个单位的对象则会完全消失在雾中。
    clock = new THREE.Clock();
    // 灯光lights
    var light = new THREE.HemisphereLight(0xffffff, 0x444444);
    light.position.set(0, 20, 0);
    scene.add(light);
    light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 20, 10);
    scene.add(light);
    // 地面ground
    var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2000, 2000), new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false }));
    mesh.rotation.x = - Math.PI / 2;
    scene.add(mesh);
    var grid = new THREE.GridHelper(200, 40, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);
    // 模型model
    var loader = new THREE.GLTFLoader();
    //这里只能加载在线链接，不能加载本地地址
    loader.load('https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb', 
    //备用模型链接
    //https://threejs.org/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb
    //https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb
    function (gltf)
    {
      model = gltf.scene;
      scene.add(model);
      createGUI(model, gltf.animations)
    }, undefined, function (e) {
      console.error(e);
    }
    );
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(wx.getSystemInfoSync().pixelRatio);
    renderer.setSize(canvas.width, canvas.height);
    renderer.gammaOutput = true;
    renderer.gammaFactor = 2.2;
    //让模型能够拖动↓
    const { OrbitControls } = registerOrbit(THREE)
    controls = new OrbitControls( camera, renderer.domElement );
    //初始视角的坐标
    camera.position.set( 5, 5, 10 );
    controls.update();
  }

  function createGUI(model, animations) {
    var states = ['Idle', 'Walking', 'Running', 'Dance', 'Death', 'Sitting', 'Standing'];
    var emotes = ['Jump', 'Yes', 'No', 'Wave', 'Punch', 'ThumbsUp'];
    mixer = new THREE.AnimationMixer(model);
    actions = {};
    for (var i = 0; i < animations.length; i++) {
      var clip = animations[i];
      var action = mixer.clipAction(clip);
      actions[clip.name] = action;
      if (emotes.indexOf(clip.name) >= 0 || states.indexOf(clip.name) >= 4) {
        action.clampWhenFinished = true;
        action.loop = THREE.LoopOnce;
      }
    }

    // expressions
    face = model.getObjectByName('Head_2');
    activeAction = actions['Walking'];//设置动作
    activeAction.play();
  }

  function fadeToAction(name, duration) {
    previousAction = activeAction;
    activeAction = actions[name];
    if (previousAction !== activeAction) {
      previousAction.fadeOut(duration);
    }
    activeAction
      .reset()
      .setEffectiveTimeScale(1)
      .setEffectiveWeight(1)
      .fadeIn(duration)
      .play();
  }
  function animate() {
    var dt = clock.getDelta();
    if (mixer) mixer.update(dt);
    canvas.requestAnimationFrame(animate);
    controls.update()
    renderer.render(scene, camera);
  }
}