#version 300 es
precision highp float;precision highp int;
#define texture2D texture
uniform vec3 cameraPosition;uniform mat4 viewMatrix;
#define varying in
out vec4 pc_fragColor;
#define gl_FragColor pc_fragColor
#define TONE_MAPPING
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color *= toneMappingExposure;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	return color;
}
vec3 CustomToneMapping( vec3 color ) { return color; }
vec3 toneMapping(vec3 c){return ACESFilmicToneMapping(c);}

const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return sRGBTransferOETF( value );
}
vec4 linearToOutputTexel(vec4 c){return LinearTosRGB(c);}
uniform float uTime,uNight,uDusk,uReflectionValid,uReflectionPixel,uBoatCount;uniform vec3 uShallow,uDeep,uNightShallow,uNightDeep;uniform sampler2D uReflection;uniform mat4 uReflectionMatrix;uniform vec3 uReflectionCenter,uReflectionNormal,uBoatCenters[3],uBoatForwards[3];varying float vDepth;varying vec3 vPosition,vWorld,vNormal;
   void main(){
    vec3 view=normalize(cameraPosition-vWorld),normal=normalize(vNormal);float facing=clamp(dot(normal,view),0.,1.);
    float shallow=1.-smoothstep(.023,.133,vDepth),fresnel=pow(1.-facing,3.);
    vec3 shallowColor=mix(uShallow,uNightShallow,uNight),deepColor=mix(uDeep,uNightDeep,uNight);
    float broad=.5+.5*sin(vPosition.x*3.6+vPosition.z*2.2)*sin(vPosition.y*3.1-vPosition.z*1.4);
    vec3 water=mix(deepColor,shallowColor,clamp(shallow*.83+broad*.13,0.,1.));
    water=mix(water,vec3(.63,.76,.78),fresnel*(.20-.09*uNight));
    // Restrained narrow brush strokes; the lake never becomes a noisy normal map.
    float waveA=sin(vPosition.x*38.+vPosition.z*17.+sin(vPosition.y*7.)*1.6+uTime*.57);
    float waveB=sin(vPosition.y*31.-vPosition.z*22.+sin(vPosition.x*8.1)*1.4-uTime*.41);
    float strokes=smoothstep(.955,.998,waveA*waveB)*(.022+.026*shallow)*(1.-uNight*.65);
    water+=vec3(.65,.84,.83)*strokes;
    float shore=(1.-smoothstep(.003,.028,vDepth))*smoothstep(.0005,.004,vDepth);
    water=mix(water,mix(vec3(.55,.77,.74),vec3(.21,.4,.45),uNight),shore*.38);
    // A reflected camera sees the actual architecture. Project onto its tangent
    // plane, then fade before the sphere's curvature makes the mapping diverge.
    vec3 planeOffset=vWorld-uReflectionCenter;float planeHeight=dot(planeOffset,uReflectionNormal);
    vec3 onPlane=vWorld-planeHeight*uReflectionNormal;
    vec4 reflected=uReflectionMatrix*vec4(onPlane,1.);vec2 uv=reflected.xy/max(.00001,reflected.w);
    uv+=vec2(waveA,waveB)*(.00065+fresnel*.0010);
    vec2 blur=vec2(uReflectionPixel*1.15,0.);vec4 mirror=texture2D(uReflection,uv)*.5;
    mirror+=(texture2D(uReflection,uv+blur)+texture2D(uReflection,uv-blur))*.25;
    float edge=smoothstep(0.,.04,uv.x)*smoothstep(0.,.04,uv.y)*(1.-smoothstep(.96,1.,uv.x))*(1.-smoothstep(.96,1.,uv.y));
    float tangentDistance=length(onPlane-uReflectionCenter);
    float reflectionMask=uReflectionValid*edge*(1.-smoothstep(.6,1.8,tangentDistance))*step(0.,reflected.w);
    vec3 reflectionColor=mirror.rgb/max(mirror.a,.001);
    reflectionColor=mix(reflectionColor,water,.15);
    float reflectionWeight=reflectionMask*mirror.a*(.43+fresnel*.28);
    water=mix(water,reflectionColor,reflectionWeight);
    vec3 rippleNormal=normalize(normal+vec3(waveA*.021,waveB*.014,(waveA-waveB)*.012));
    vec3 sunlight=normalize(vec3(-5.,8.,5.));float glint=pow(max(dot(reflect(-sunlight,rippleNormal),view),0.),95.);
    water+=mix(vec3(.56,.57,.40),vec3(.35,.40,.48),uNight)*glint*(.22-.09*uNight);
    water+=vec3(.065,.037,.013)*uDusk*(.18+glint);
    float wake=0.;for(int i=0;i<3;i++){if(float(i)>=uBoatCount)continue;vec3 offset=vPosition-uBoatCenters[i],boatUp=normalize(uBoatCenters[i]);offset-=boatUp*dot(offset,boatUp);float behind=-dot(offset,uBoatForwards[i]),lateral=length(offset+uBoatForwards[i]*behind);
     float width=.055+max(0.,behind)*.26,wing=exp(-pow((lateral-width)/.013,2.));float stern=smoothstep(.08,.18,behind)*(1.-smoothstep(.32,.70,behind));
     float side=exp(-pow((lateral-.082)/.014,2.))*(1.-smoothstep(.10,.24,abs(behind)));
     float broken=.62+.38*sin(behind*26.-uTime*2.0+float(i)*2.);wake=max(wake,(wing*stern*.18+side*.09)*broken);
    }
    water=mix(water,mix(vec3(.73,.87,.84),vec3(.29,.48,.57),uNight),wake);
    float alpha=clamp(.38+(1.-shallow)*.13+fresnel*.19+reflectionWeight*.20,.35,.78);
    gl_FragColor=vec4(water,alpha);
    #if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif
    gl_FragColor = linearToOutputTexel( gl_FragColor );
   }