package images

import (
	"reflect"
	"testing"

	"github.com/sourcegraph/sourcegraph/dev/sg/internal/stdout"
)

func TestParseTag(t *testing.T) {
	stdout.Out.SetVerbose()
	tests := []struct {
		name    string
		tag     string
		want    *SgImageTag
		wantErr bool
	}{
		{
			"base",
			"12345_2021-01-02_abcdefghijkl",
			&SgImageTag{
				buildNum:  12345,
				date:      "2021-01-02",
				shortSHA1: "abcdefghijkl",
			},
			false,
		},
		{
			"err",
			"3.25.5",
			nil,
			true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ParseTag(tt.tag)
			if (err != nil) != tt.wantErr {
				t.Errorf("ParseTag() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("ParseTag() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func Test_findLatestTag(t *testing.T) {
	stdout.Out.SetVerbose()

	tests := []struct {
		name string
		tags []string
		want string
	}{
		{
			"base",
			[]string{"v3.25.2", "12345_2022-01-01_abcdefghijkl"},
			"12345_2022-01-01_abcdefghijkl",
		},
		{
			"higher_build_first",
			[]string{"99981_2022-01-15_999999a", "99982_2022-01-29_abcdefghijkl"},
			"99982_2022-01-29_abcdefghijkl",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := findLatestTag(tt.tags); got != tt.want {
				t.Errorf("findLatestTag() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestParseRawImgString(t *testing.T) {
	stdout.Out.SetVerbose()

	tests := []struct {
		name string
		tag  string
		want *imageReference
	}{
		{
			"base",
			"index.docker.io/sourcegraph/server:3.36.2@sha256:07d7407fdc656d7513aa54cdffeeecb33aa4e284eea2fd82e27342411430e5f2",
			&imageReference{
				Registry: "docker.io",
				Name:     "sourcegraph/server",
				Tag:      "3.36.2",
				Digest:   "sha256:07d7407fdc656d7513aa54cdffeeecb33aa4e284eea2fd82e27342411430e5f2",
			},
		},
		{
			"base",
			"index.docker.io/sourcegraph/server:3.36.2",
			&imageReference{
				Registry: "docker.io",
				Name:     "sourcegraph/server",
				Tag:      "3.36.2",
				Digest:   "",
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got, _ := parseImgString(tt.tag); !reflect.DeepEqual(got, tt.want) {
				t.Errorf("parseImgString() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func Test_createAndFillImageRepository(t *testing.T) {
	stdout.Out.SetVerbose()

	tests := []struct {
		name     string
		ref      *imageReference
		pinTag   string
		wantRepo *imageRepository
		wantErr  bool
	}{
		{
			"unsupported registry",
			&imageReference{
				Registry:    "gcr.io",
				Credentials: nil,
				Name:        "",
				Digest:      "",
				Tag:         "",
			},
			"",
			nil,
			true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotRepo, err := createAndFillImageRepository(tt.ref, tt.pinTag)
			if (err != nil) != tt.wantErr {
				t.Errorf("createAndFillImageRepository() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(gotRepo, tt.wantRepo) {
				t.Errorf("createAndFillImageRepository() gotRepo = %v, want %v", gotRepo, tt.wantRepo)
			}
		})
	}
}
