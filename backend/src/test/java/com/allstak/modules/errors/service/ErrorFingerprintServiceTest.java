package com.allstak.modules.errors.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ErrorFingerprintServiceTest {

    private ErrorFingerprintService service;

    @BeforeEach
    void setUp() {
        service = new ErrorFingerprintService();
    }

    @Test
    @DisplayName("Returns 64-char hex string")
    void generate_returnsHex64() {
        String fp = service.generate("java.lang.NullPointerException", null);
        assertThat(fp).hasSize(64).matches("[0-9a-f]+");
    }

    @Test
    @DisplayName("Same inputs produce same fingerprint (deterministic)")
    void generate_isDeterministic() {
        List<String> frames = List.of(
                "com.example.Service.doWork(Service.java:42)",
                "com.example.Controller.handle(Controller.java:18)"
        );
        String fp1 = service.generate("java.lang.NullPointerException", frames);
        String fp2 = service.generate("java.lang.NullPointerException", frames);
        assertThat(fp1).isEqualTo(fp2);
    }

    @Test
    @DisplayName("Different frames → different fingerprints")
    void generate_differentFrames_differentFingerprints() {
        List<String> frames1 = List.of("com.example.ServiceA.doWork(ServiceA.java:10)");
        List<String> frames2 = List.of("com.example.ServiceB.doOther(ServiceB.java:20)");
        assertThat(service.generate("java.lang.NullPointerException", frames1))
                .isNotEqualTo(service.generate("java.lang.NullPointerException", frames2));
    }

    @Test
    @DisplayName("Different exceptionClass → different fingerprints even with same frames")
    void generate_differentExceptionClass_differentFingerprints() {
        List<String> frames = List.of("com.example.Service.run(Service.java:10)");
        assertThat(service.generate("java.lang.NullPointerException", frames))
                .isNotEqualTo(service.generate("java.lang.IllegalArgumentException", frames));
    }

    @Test
    @DisplayName("Null frames falls back to exceptionClass only")
    void generate_nullFrames_usesExceptionClass() {
        String fp1 = service.generate("java.lang.NullPointerException", null);
        String fp2 = service.generate("java.lang.NullPointerException", null);
        assertThat(fp1).isEqualTo(fp2).hasSize(64);
    }

    @Test
    @DisplayName("Empty frame list falls back to exceptionClass only")
    void generate_emptyFrames_usesExceptionClass() {
        String fp1 = service.generate("java.lang.NullPointerException", List.of());
        String fp2 = service.generate("java.lang.NullPointerException", null);
        assertThat(fp1).isEqualTo(fp2);
    }

    @Test
    @DisplayName("Skips Spring/JDK internal frames, takes top app frames")
    void buildInput_skipsInternalFrames() {
        List<String> frames = List.of(
                "com.example.MyService.doIt(MyService.java:10)",
                "org.springframework.web.servlet.DispatcherServlet.doDispatch(DispatcherServlet.java:1089)",
                "java.lang.Thread.run(Thread.java:833)",
                "com.example.OtherService.call(OtherService.java:55)"
        );
        String input = service.buildInput("com.example.MyException", frames);

        assertThat(input).contains("com.example.MyService.doIt");
        assertThat(input).contains("com.example.OtherService.call");
        assertThat(input).doesNotContain("org.springframework");
        assertThat(input).doesNotContain("java.lang.Thread");
    }

    @Test
    @DisplayName("Limits to TOP_FRAMES application frames")
    void buildInput_limitsToTopFrames() {
        List<String> frames = new java.util.ArrayList<>();
        for (int i = 0; i < ErrorFingerprintService.TOP_FRAMES + 5; i++) {
            frames.add("com.example.Class" + i + ".method(Class.java:" + i + ")");
        }
        String input = service.buildInput("com.example.Ex", frames);
        long pipeCount = input.chars().filter(c -> c == '|').count();
        // At most TOP_FRAMES pipes (1 between class and first frame, TOP_FRAMES-1 between frames)
        assertThat(pipeCount).isLessThanOrEqualTo(ErrorFingerprintService.TOP_FRAMES);
    }

    @Test
    @DisplayName("When all frames are internal, falls back to exceptionClass only")
    void buildInput_allInternalFrames_returnsExceptionClassOnly() {
        List<String> frames = List.of(
                "org.springframework.web.servlet.DispatcherServlet.service(DispatcherServlet.java:897)",
                "java.lang.Thread.run(Thread.java:833)"
        );
        String input = service.buildInput("java.lang.NullPointerException", frames);
        assertThat(input).isEqualTo("java.lang.NullPointerException");
    }
}
