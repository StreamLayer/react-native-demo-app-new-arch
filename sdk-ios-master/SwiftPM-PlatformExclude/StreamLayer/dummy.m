#import <TargetConditionals.h>
#if TARGET_OS_WATCH || TARGET_OS_TV
#warning "StreamLayer does not support the watchOS ot tvOS platform"
#endif
