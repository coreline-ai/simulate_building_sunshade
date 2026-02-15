import type React from 'react';
import { BuildingPosition, SEASONS, SeasonKey } from '@/features/sun-simulation/model';

interface SunDirectionDialProps {
  dialRef: React.RefObject<HTMLDivElement | null>;
  sunRiseAngle: number;
  riseDirection: string;
  setDirection: string;
  onDialStart: (e: React.MouseEvent | React.TouchEvent) => void;
}

export function SunDirectionDial({
  dialRef,
  sunRiseAngle,
  riseDirection,
  setDirection,
  onDialStart,
}: SunDirectionDialProps) {
  return (
    <div className="absolute top-4 left-4 bg-white/95 rounded-xl shadow-2xl p-4 backdrop-blur-sm">
      <div className="text-center mb-2">
        <span className="text-sm font-bold text-gray-700">🧭 해 뜨는 방향</span>
      </div>

      <div
        ref={dialRef}
        className="relative w-36 h-36 cursor-pointer select-none touch-none"
        onMouseDown={onDialStart}
        onTouchStart={onDialStart}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 shadow-inner border-2 border-gray-300 pointer-events-none">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = ((angle - 90) * Math.PI) / 180;
            const x = 50 + 42 * Math.cos(rad);
            const y = 50 + 42 * Math.sin(rad);
            const label =
              angle === 0
                ? '북'
                : angle === 90
                  ? '동'
                  : angle === 180
                    ? '남'
                    : angle === 270
                      ? '서'
                      : '';
            return (
              <div
                key={angle}
                className="absolute text-xs font-bold pointer-events-none"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                  color:
                    angle === 0
                      ? '#96CEB4'
                      : angle === 90
                        ? '#FF6B6B'
                        : angle === 180
                          ? '#45B7D1'
                          : angle === 270
                            ? '#4ECDC4'
                            : '#999',
                }}
              >
                {label}
              </div>
            );
          })}
        </div>

        <div
          className="absolute w-5 h-5 bg-orange-500 rounded-full shadow-lg border-2 border-white transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${50 + 40 * Math.cos(((sunRiseAngle - 90) * Math.PI) / 180)}%`,
            top: `${50 + 40 * Math.sin(((sunRiseAngle - 90) * Math.PI) / 180)}%`,
          }}
        />

        <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-white rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2 border-2 border-gray-300 pointer-events-none">
          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400" />
        </div>
      </div>

      <div className="text-center mt-2">
        <div className="text-xs text-gray-500">방위각: {sunRiseAngle}°</div>
        <div className="text-xs text-orange-600 font-medium">
          해가 <strong className="text-orange-700">{riseDirection}</strong>에서 떠서{' '}
          <strong className="text-orange-700">{setDirection}</strong>으로 짐
        </div>
      </div>
    </div>
  );
}

interface SimulationControlPanelProps {
  time: number;
  season: SeasonKey;
  isAnimating: boolean;
  onTimeChange: (time: number) => void;
  onToggleAnimation: () => void;
  onSeasonChange: (season: SeasonKey) => void;
}

const formatTime = (value: number) => {
  const hours = Math.floor(value);
  const minutes = Math.floor((value % 1) * 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export function SimulationControlPanel({
  time,
  season,
  isAnimating,
  onTimeChange,
  onToggleAnimation,
  onSeasonChange,
}: SimulationControlPanelProps) {
  return (
    <div className="absolute top-72 left-4 bg-white/95 rounded-xl shadow-2xl p-5 w-72 backdrop-blur-sm">
      <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
        ☀️ 태양 시뮬레이션
      </h2>

      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">시간 선택</label>
          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {formatTime(time)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="24"
          step="0.1"
          value={time}
          onChange={(e) => onTimeChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>
      </div>

      <button
        onClick={onToggleAnimation}
        className={`w-full py-2 px-4 rounded-lg font-medium mb-4 transition-all ${
          isAnimating ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isAnimating ? '⏸ 정지' : '▶ 자동 재생'}
      </button>

      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 block mb-2">계절 선택</label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(SEASONS) as SeasonKey[]).map((key) => (
            <button
              key={key}
              onClick={() => onSeasonChange(key)}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                season === key ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {SEASONS[key].name}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
        기준일: {SEASONS[season].baseDate}
      </div>
    </div>
  );
}

interface BuildingControlPanelProps {
  buildings: BuildingPosition[];
  selectedBuilding: number | null;
  onSelectBuilding: (id: number) => void;
  onMoveBuilding: (id: number, dx: number, dz: number) => void;
  onSetBuildingX: (id: number, x: number) => void;
  onSetBuildingZ: (id: number, z: number) => void;
  onResetBuildings: () => void;
}

export function BuildingControlPanel({
  buildings,
  selectedBuilding,
  onSelectBuilding,
  onMoveBuilding,
  onSetBuildingX,
  onSetBuildingZ,
  onResetBuildings,
}: BuildingControlPanelProps) {
  return (
    <div className="absolute top-4 right-4 bg-white/95 rounded-xl shadow-2xl p-5 w-80 backdrop-blur-sm max-h-[90vh] overflow-y-auto">
      <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
        🏢 건물 위치 설정
      </h2>

      <div className="text-xs text-gray-500 mb-4 bg-blue-50 p-2 rounded-lg">
        💡 3D 뷰에서 건물을 직접 드래그하거나 아래 버튼으로 위치를 조정하세요
      </div>

      {buildings.map((building) => (
        <div
          key={building.id}
          className={`mb-4 p-3 rounded-lg border-2 transition-all ${
            selectedBuilding === building.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
          }`}
          onClick={() => onSelectBuilding(building.id)}
        >
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-gray-700">{building.name}</span>
            <span className="text-xs text-gray-500">
              (X: {building.x}, Z: {building.z})
            </span>
          </div>

          <div className="mb-3">
            <label className="text-xs font-medium text-gray-600 block mb-2">방향 이동</label>
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveBuilding(building.id, 0, -10);
                }}
                className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-sm transition-all shadow-md active:scale-95"
                title="북쪽으로 이동"
              >
                북
              </button>

              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveBuilding(building.id, -10, 0);
                  }}
                  className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-sm transition-all shadow-md active:scale-95"
                  title="동쪽으로 이동"
                >
                  동
                </button>
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-gray-400 rounded-full" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveBuilding(building.id, 10, 0);
                  }}
                  className="w-10 h-10 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-bold text-sm transition-all shadow-md active:scale-95"
                  title="서쪽으로 이동"
                >
                  서
                </button>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveBuilding(building.id, 0, 10);
                }}
                className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-sm transition-all shadow-md active:scale-95"
                title="남쪽으로 이동"
              >
                남
              </button>
            </div>
          </div>

          <div className="border-t pt-3">
            <label className="text-xs font-medium text-gray-600 block mb-2">세밀 조절</label>

            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">동서 위치</span>
                <span className="font-medium text-blue-600">{building.x}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={building.x}
                onChange={(e) => onSetBuildingX(building.id, parseInt(e.target.value, 10))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>동 (-X)</span>
                <span>서 (+X)</span>
              </div>
            </div>

            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">남북 위치</span>
                <span className="font-medium text-green-600">{building.z}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={building.z}
                onChange={(e) => onSetBuildingZ(building.id, parseInt(e.target.value, 10))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>북 (-Z)</span>
                <span>남 (+Z)</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={onResetBuildings}
        className="w-full py-2 px-4 rounded-lg font-medium bg-gray-500 hover:bg-gray-600 text-white transition-all"
      >
        🔄 초기 위치로 리셋
      </button>
    </div>
  );
}

interface SunInfoPanelProps {
  time: number;
  season: SeasonKey;
}

export function SunInfoPanel({ time, season }: SunInfoPanelProps) {
  return (
    <div className="absolute bottom-4 left-4 bg-white/90 rounded-xl shadow-lg p-4 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full shadow-lg"
            style={{
              background:
                time >= 6 && time <= 18
                  ? 'linear-gradient(135deg, #FDB813, #FFE4B5)'
                  : 'linear-gradient(135deg, #1a1a2e, #2d2d5a)',
            }}
          />
          <span className="text-sm font-medium text-gray-700">
            {time >= 6 && time < 12 ? '오전' : time >= 12 && time < 18 ? '오후' : time >= 18 && time < 21 ? '저녁' : '밤'}
          </span>
        </div>
        <div className="h-4 w-px bg-gray-300" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">태양 고도:</span>
          <span className="text-sm font-medium text-orange-600">
            {time >= 6 && time <= 18
              ? `${Math.round(Math.sin(((time - 6) / 12) * Math.PI) * SEASONS[season].sunAngle)}°`
              : '-'}
          </span>
        </div>
      </div>
    </div>
  );
}

export function MouseControlHint() {
  return (
    <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs rounded-lg p-3 backdrop-blur-sm">
      <div className="mb-1 font-medium">마우스 컨트롤</div>
      <div className="text-gray-300">
        <div>• 건물 클릭+드래그: 건물 이동</div>
        <div>• 빈 공간 드래그: 카메라 회전</div>
        <div>• 스크롤: 확대/축소</div>
      </div>
    </div>
  );
}
