enum EffectType {
    IMMEDIATE_SHOW = 0,    ///< 直接显示.
    LEFT_PARALLEL_MOVE = 1,    ///< 向左平移.
    RIGHT_PARALLEL_MOVE = 2,    ///< 向右平移.
    UP_PARALLEL_MOVE = 3,    ///< 向上平移.
    DOWN_PARALLEL_MOVE = 4,    ///< 向下平移.
    LEFT_COVER = 5,    ///< 向左覆盖.
    RIGHT_COVER = 6,    ///< 向右覆盖.
    UP_COVER = 7,    ///< 向上覆盖.
    DOWN_COVER = 8,    ///< 向下覆盖.
    LEFT_TOP_COVER = 9,    ///< 左上覆盖.
    LEFT_BOTTOM_COVER = 10,   ///< 左下覆盖.
    RIGHT_TOP_COVER = 11,   ///< 右上覆盖.
    RIGHT_BOTTOM_COVER = 12,   ///< 右下覆盖.
    HORIZONTAL_DIVIDE = 13,   ///< 水平对开.
    VERTICAL_DIVIDE = 14,   ///< 垂直对开.
    HORIZONTAL_CLOSE = 15,   ///< 水平闭合.
    VERTICAL_CLOSE = 16,   ///< 垂直闭合.
    FADE = 17,              ///< 淡入淡出.
    HORIZONTAL_SHUTTER = 18,   ///< 水平百叶窗.
    VERTICAL_SHUTTER = 19,   ///< 垂直百叶窗.
    NOT_CLEAR_AREA = 20,   ///< 不清屏.
    LEFT_SERIES_MOVE = 21,   ///< 连续左移.
    RIGHT_SERIES_MOVE = 22,   ///< 连续右移.
    UP_SERIES_MOVE = 23,   ///< 连续上移.
    DOWN_SERIES_MOVE = 24,   ///< 连续下移.
    RANDOM = 25,   ///< 随机特效.
    HT_LEFT_SERIES_MOVE = 26,   ///< 首尾相接连续左移.
    HT_RIGHT_SERIES_MOVE = 27,   ///< 首尾相接连续右移.
    HT_UP_SERIES_MOVE = 28,   ///< 首尾相接连续上移.
    HT_DOWN_SERIES_MOVE = 29,   ///< 首尾相接连续下移.
    EFFECT_COUNTS = 30,   ///< 特效总数.
}

enum CmdType {
    kUnknown = -1,
    kTcpHeartbeatAsk = 0x005f,      ///< TCP心跳包请求
    kTcpHeartbeatAnswer = 0x0060,   ///< TCP心跳包反馈
    kSearchDeviceAsk = 0x1001,      ///< 搜索设备请求
    kSearchDeviceAnswer = 0x1002,   ///< 搜索设备应答
    kErrorAnswer = 0x2000,          ///< 出错反馈
    kSDKServiceAsk = 0x2001,        ///< 版本协商请求
    kSDKServiceAnswer = 0x2002,     ///< 版本协商应答
    kSDKCmdAsk = 0x2003,            ///< sdk命令请求
    kSDKCmdAnswer = 0x2004,         ///< sdk命令反馈
    kGPSInfoAnswer = 0x3007,        ///<gps信息应答
    kFileStartAsk = 0x8001,         ///< 文件开始传输请求
    kFileStartAnswer = 0x8002,      ///< 文件开始传输应答
    kFileContentAsk = 0x8003,       ///< 携带文件内容的请求
    kFileContentAnswer = 0x8004,    ///< 写文件内容的应答
    kFileEndAsk = 0x8005,           ///< 文件结束传输请求
    kFileEndAnswer = 0x8006,        ///< 文件结束传输应答
    kReadFileAsk = 0x8007,          ///< 回读文件请求
    kReadFileAnswer = 0x8008,       ///< 回读文件应答
}

enum SdkErrorCode {
    kSuccess = 0,
    kWriteFinish,           ///< 写文件完成
    kProcessError,          ///< 流程错误
    kVersionTooLow,         ///< 版本过低
    kDeviceOccupa,          ///< 设备被占用
    kFileOccupa,            ///< 文件被占用
    kReadFileExcessive,     ///< 回读文件用户过多
    kInvalidPacketLen,      ///< 数据包长度错误
    kInvalidParam,          ///< 无效的参数
    kNotSpaceToSave,        ///< 存储空间不够
    kCreateFileFailed,      ///< 创建文件失败
    kWriteFileFailed,       ///< 写文件失败
    kReadFileFailed,        ///< 读文件失败
    kInvalidFileData,       ///< 无效的文件数据
    kFileContentError,      ///< 文件内容出错
    kOpenFileFailed,        ///< 打开文件失败
    kSeekFileFailed,        ///< 定位文件失败
    kRenameFailed,          ///< 重命名失败
    kFileNotFound,          ///< 文件未找到
    kFileNotFinish,         ///< 文件未接收完成
    kXmlCmdTooLong,         ///< xml命令过长
    kInvalidXmlIndex,       ///< 无效的xml命令索引值
    kParseXmlFailed,        ///< 解析xml出错
    kInvalidMethod,         ///< 无效的方法名
    kMemoryFailed,          ///< 内存错误
    kSystemError,           ///< 系统错误
    kUnsupportVideo,        ///< 不支持的视频
    kNotMediaFile,          ///< 不是多媒体文件
    kParseVideoFailed,      ///< 解析视频文件失败
    kUnsupportFrameRate,    ///< 不支持的波特率
    kUnsupportResolution,   ///< 不支持的分辨率(视频)
    kUnsupportFormat,       ///< 不支持的格式(视频)
    kUnsupportDuration,     ///< 不支持的时间长度(视频)
    kDownloadFileFailed,    ///< 下载文件失败
    kScreenNodeIsNull,      ///< 显示屏节点为null
    kNodeExist,             ///< 节点存在
    kNodeNotExist,          ///< 节点不存在
    kPluginNotExist,        ///< 插件不存在
    kCheckLicenseFailed,    ///< 校验license失败
    kNotFoundWifiModule,    ///< 未找到wifi模块
    kTestWifiUnsuccessful,  ///< 测试wifi模块未
    kRunningError,          ///< 运行错误
    kUnsupportMethod,       ///< 不支持的方法
    kInvalidGUID,           ///< 非法的guid
    kFirmwareFormatError,   ///< 固件格式错误
    kTagNotFound,           ///< 标签不存在
    kAttrNotFound,          ///< 属性不存在
    kCreateTagFailed,       ///< 创建标签失败
    kUnsupportDeviceType,   ///< 不支持的设备型号
    kPermissionDenied,      ///< 权限不足
    kPasswdTooSimple,       ///< 密码太简单
    kDelayRespond,          ///< 延迟反馈
    kShortlyReturn,         ///< 直接返回, 不进行xml转换
    kCount,
}

export { CmdType, SdkErrorCode, EffectType };